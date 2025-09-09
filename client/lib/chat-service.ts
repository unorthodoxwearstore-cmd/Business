import { ChatChannel, ChatMessage } from '@/shared/types';
import { authService } from '@/lib/auth-service';
import { staffService } from '@/lib/staff-service';
import { notificationService } from '@/lib/notification-service';

interface CreateChannelData {
  name: string;
  type: 'direct' | 'group' | 'announcement';
  members: string[];
  description?: string;
}

class ChatService {
  private readonly CHANNELS_KEY = 'hisaabb_chat_channels';
  private readonly MESSAGES_KEY = 'hisaabb_chat_messages';

  private channelsDatabase = new Map<string, ChatChannel>();
  private messagesDatabase = new Map<string, ChatMessage>();

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultChannels();
  }

  private loadFromStorage(): void {
    try {
      const channelsData = localStorage.getItem(this.CHANNELS_KEY);
      if (channelsData) {
        const channels = JSON.parse(channelsData);
        channels.forEach((channel: ChatChannel) => {
          this.channelsDatabase.set(channel.id, channel);
        });
      }

      const messagesData = localStorage.getItem(this.MESSAGES_KEY);
      if (messagesData) {
        const messages = JSON.parse(messagesData);
        messages.forEach((message: ChatMessage) => {
          this.messagesDatabase.set(message.id, message);
        });
      }
    } catch (error) {
      console.error('Error loading chat data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.CHANNELS_KEY, JSON.stringify(Array.from(this.channelsDatabase.values())));
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(Array.from(this.messagesDatabase.values())));
    } catch (error) {
      console.error('Error saving chat data to storage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultChannels(): void {
    const user = authService.getCurrentUser();
    if (!user) return;

    // Check if default channels already exist for this business
    const businessChannels = Array.from(this.channelsDatabase.values())
      .filter(channel => channel.businessId === user.businessId);

    if (businessChannels.length === 0) {
      // Create default announcement channel
      const announcementChannel: ChatChannel = {
        id: this.generateId(),
        name: 'Announcements',
        type: 'announcement',
        businessId: user.businessId,
        members: [user.id],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isActive: true,
        description: 'Official announcements from management'
      };

      this.channelsDatabase.set(announcementChannel.id, announcementChannel);

      // Create general team channel
      const generalChannel: ChatChannel = {
        id: this.generateId(),
        name: 'General',
        type: 'group',
        businessId: user.businessId,
        members: [user.id],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isActive: true,
        description: 'General team discussions'
      };

      this.channelsDatabase.set(generalChannel.id, generalChannel);
      this.saveToStorage();
    }
  }

  async createChannel(channelData: CreateChannelData): Promise<{ success: boolean; channel?: ChatChannel; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Only owners, co-founders, and managers can create announcement channels
      if (channelData.type === 'announcement' && !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied to create announcement channel' };
      }

      // Validation
      if (!channelData.name.trim()) {
        return { success: false, message: 'Channel name is required' };
      }

      if (channelData.members.length === 0) {
        return { success: false, message: 'At least one member is required' };
      }

      // Check for duplicate channel names within the business
      const existingChannels = Array.from(this.channelsDatabase.values())
        .filter(channel => channel.businessId === user.businessId);

      if (existingChannels.some(channel => channel.name.toLowerCase() === channelData.name.toLowerCase())) {
        return { success: false, message: 'A channel with this name already exists' };
      }

      const channelId = this.generateId();
      const now = new Date().toISOString();

      // Include creator in members if not already included
      const members = channelData.members.includes(user.id) 
        ? channelData.members 
        : [user.id, ...channelData.members];

      const channel: ChatChannel = {
        id: channelId,
        name: channelData.name,
        type: channelData.type,
        businessId: user.businessId,
        members: members,
        createdBy: user.id,
        createdAt: now,
        lastActivity: now,
        isActive: true,
        description: channelData.description
      };

      this.channelsDatabase.set(channelId, channel);
      this.saveToStorage();

      // Send system message about channel creation
      await this.sendMessage(channelId, {
        content: `${user.name} created the channel`,
        type: 'system'
      });

      notificationService.success('Channel Created', `Channel "${channelData.name}" has been created`);
      return { success: true, channel, message: 'Channel created successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to create channel' };
    }
  }

  async sendMessage(channelId: string, messageData: { content: string; type?: 'text' | 'file' | 'image' | 'document' | 'system'; attachments?: any[]; replyTo?: string }): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const channel = this.channelsDatabase.get(channelId);
      if (!channel) {
        return { success: false, error: 'Channel not found' };
      }

      if (!channel.members.includes(user.id)) {
        return { success: false, error: 'Not a member of this channel' };
      }

      // For announcement channels, only owners/managers can send messages
      if (channel.type === 'announcement' && !authService.hasPermission('manage_team')) {
        return { success: false, error: 'Permission denied to send messages in announcement channel' };
      }

      if (!messageData.content.trim()) {
        return { success: false, error: 'Message content is required' };
      }

      const messageId = this.generateId();
      const now = new Date().toISOString();

      const message: ChatMessage = {
        id: messageId,
        channelId: channelId,
        senderId: user.id,
        senderName: user.name,
        content: messageData.content,
        type: messageData.type || 'text',
        timestamp: now,
        isEdited: false,
        attachments: messageData.attachments || [],
        replyTo: messageData.replyTo,
        mentions: this.extractMentions(messageData.content),
        readBy: [{ staffId: user.id, readAt: now }]
      };

      this.messagesDatabase.set(messageId, message);

      // Update channel last activity
      const updatedChannel: ChatChannel = {
        ...channel,
        lastActivity: now
      };
      this.channelsDatabase.set(channelId, updatedChannel);

      this.saveToStorage();

      return { success: true, message };
    } catch (error) {
      return { success: false, error: 'Failed to send message' };
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const message = this.messagesDatabase.get(messageId);
    if (!message) return;

    // Check if user already read this message
    const alreadyRead = message.readBy.some(read => read.staffId === user.id);
    if (alreadyRead) return;

    const updatedMessage: ChatMessage = {
      ...message,
      readBy: [...message.readBy, { staffId: user.id, readAt: new Date().toISOString() }]
    };

    this.messagesDatabase.set(messageId, updatedMessage);
    this.saveToStorage();
  }

  async editMessage(messageId: string, newContent: string): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const message = this.messagesDatabase.get(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      if (message.senderId !== user.id) {
        return { success: false, error: 'Permission denied' };
      }

      if (!newContent.trim()) {
        return { success: false, error: 'Message content is required' };
      }

      const updatedMessage: ChatMessage = {
        ...message,
        content: newContent,
        isEdited: true,
        editedAt: new Date().toISOString(),
        mentions: this.extractMentions(newContent)
      };

      this.messagesDatabase.set(messageId, updatedMessage);
      this.saveToStorage();

      return { success: true, message: updatedMessage };
    } catch (error) {
      return { success: false, error: 'Failed to edit message' };
    }
  }

  getChannels(): ChatChannel[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    return Array.from(this.channelsDatabase.values())
      .filter(channel => 
        channel.businessId === user.businessId && 
        channel.members.includes(user.id) &&
        channel.isActive
      )
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }

  getChannelMessages(channelId: string, limit: number = 50, offset: number = 0): ChatMessage[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const channel = this.channelsDatabase.get(channelId);
    if (!channel || !channel.members.includes(user.id)) {
      return [];
    }

    const messages = Array.from(this.messagesDatabase.values())
      .filter(message => message.channelId === channelId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return messages.slice(offset, offset + limit);
  }

  getUnreadCount(channelId?: string): number {
    const user = authService.getCurrentUser();
    if (!user) return 0;

    let messages = Array.from(this.messagesDatabase.values())
      .filter(message => message.senderId !== user.id);

    if (channelId) {
      messages = messages.filter(message => message.channelId === channelId);
    } else {
      // Filter by user's channels
      const userChannels = this.getChannels().map(c => c.id);
      messages = messages.filter(message => userChannels.includes(message.channelId));
    }

    return messages.filter(message => 
      !message.readBy.some(read => read.staffId === user.id)
    ).length;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  async createDirectChannel(otherUserId: string): Promise<{ success: boolean; channel?: ChatChannel; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const otherUser = staffService.getStaffById(otherUserId);
      if (!otherUser) {
        return { success: false, message: 'User not found' };
      }

      // Check if direct channel already exists
      const existingChannel = Array.from(this.channelsDatabase.values())
        .find(channel => 
          channel.type === 'direct' &&
          channel.businessId === user.businessId &&
          channel.members.length === 2 &&
          channel.members.includes(user.id) &&
          channel.members.includes(otherUserId)
        );

      if (existingChannel) {
        return { success: true, channel: existingChannel, message: 'Direct channel already exists' };
      }

      // Create new direct channel
      const channelName = `${user.name} & ${otherUser.name}`;
      
      return await this.createChannel({
        name: channelName,
        type: 'direct',
        members: [otherUserId],
        description: 'Direct conversation'
      });
    } catch (error) {
      return { success: false, message: 'Failed to create direct channel' };
    }
  }

  async addMemberToChannel(channelId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const channel = this.channelsDatabase.get(channelId);
      if (!channel) {
        return { success: false, message: 'Channel not found' };
      }

      if (channel.type === 'direct') {
        return { success: false, message: 'Cannot add members to direct channels' };
      }

      if (!channel.members.includes(user.id)) {
        return { success: false, message: 'Not a member of this channel' };
      }

      if (channel.members.includes(staffId)) {
        return { success: false, message: 'User is already a member of this channel' };
      }

      const staff = staffService.getStaffById(staffId);
      if (!staff) {
        return { success: false, message: 'Staff member not found' };
      }

      const updatedChannel: ChatChannel = {
        ...channel,
        members: [...channel.members, staffId],
        lastActivity: new Date().toISOString()
      };

      this.channelsDatabase.set(channelId, updatedChannel);
      this.saveToStorage();

      // Send system message
      await this.sendMessage(channelId, {
        content: `${user.name} added ${staff.name} to the channel`,
        type: 'system'
      });

      return { success: true, message: 'Member added successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to add member' };
    }
  }

  async removeMemberFromChannel(channelId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const channel = this.channelsDatabase.get(channelId);
      if (!channel) {
        return { success: false, message: 'Channel not found' };
      }

      if (channel.type === 'direct') {
        return { success: false, message: 'Cannot remove members from direct channels' };
      }

      // Only channel creator or managers can remove members
      if (channel.createdBy !== user.id && !authService.hasPermission('manage_team')) {
        return { success: false, message: 'Permission denied' };
      }

      if (!channel.members.includes(staffId)) {
        return { success: false, message: 'User is not a member of this channel' };
      }

      const staff = staffService.getStaffById(staffId);
      const staffName = staff ? staff.name : 'Unknown User';

      const updatedChannel: ChatChannel = {
        ...channel,
        members: channel.members.filter(id => id !== staffId),
        lastActivity: new Date().toISOString()
      };

      this.channelsDatabase.set(channelId, updatedChannel);
      this.saveToStorage();

      // Send system message
      await this.sendMessage(channelId, {
        content: `${user.name} removed ${staffName} from the channel`,
        type: 'system'
      });

      return { success: true, message: 'Member removed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to remove member' };
    }
  }

  searchMessages(query: string, channelId?: string): ChatMessage[] {
    const user = authService.getCurrentUser();
    if (!user || !query.trim()) return [];

    let messages = Array.from(this.messagesDatabase.values());

    // Filter by user's accessible channels
    const userChannels = this.getChannels().map(c => c.id);
    messages = messages.filter(message => userChannels.includes(message.channelId));

    if (channelId) {
      messages = messages.filter(message => message.channelId === channelId);
    }

    // Search in message content
    const searchTerm = query.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(searchTerm) ||
      message.senderName.toLowerCase().includes(searchTerm)
    ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export const chatService = new ChatService();
export type { ChatChannel, ChatMessage, CreateChannelData };
