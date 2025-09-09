import { RequestHandler } from "express";
import {
  SignupRequest,
  SignupResponse,
  StaffSigninRequest,
  OwnerSigninRequest,
  SigninResponse,
  ApiResponse,
  User,
  Business,
  BusinessType,
  UserRole
} from "@shared/api";

// Mock database - In production, this would be replaced with actual database operations
const businesses: Business[] = [];
const users: User[] = [];

// Helper functions for password hashing (in production, use bcrypt)
const hashPassword = (password: string): string => {
  // This is a mock implementation - use proper bcrypt in production
  return Buffer.from(password).toString('base64');
};

const verifyPassword = (password: string, hash: string): boolean => {
  // This is a mock implementation - use proper bcrypt in production
  return Buffer.from(password).toString('base64') === hash;
};

// Helper function to generate JWT tokens (in production, use proper JWT library)
const generateTokens = (user: User, business: Business) => {
  // This is a mock implementation - use proper JWT in production
  const accessToken = Buffer.from(JSON.stringify({ userId: user.id, businessId: business.id })).toString('base64');
  const refreshToken = Buffer.from(JSON.stringify({ userId: user.id, type: 'refresh' })).toString('base64');
  
  return { accessToken, refreshToken };
};

// Business Owner Signup
export const handleSignup: RequestHandler = (req, res) => {
  try {
    const signupData: SignupRequest = req.body;

    // Validate required fields
    if (!signupData.businessName || !signupData.ownerName || !signupData.email || 
        !signupData.phone || !signupData.ownerPassword || !signupData.staffPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      } as ApiResponse<null>);
    }

    // Check if business already exists
    const existingBusiness = businesses.find(b => 
      b.name.toLowerCase() === signupData.businessName.toLowerCase() ||
      b.ownerEmail.toLowerCase() === signupData.email.toLowerCase()
    );

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: 'Business name or email already exists'
      } as ApiResponse<null>);
    }

    // Create business
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const business: Business = {
      id: businessId,
      name: signupData.businessName,
      type: signupData.businessType,
      ownerName: signupData.ownerName,
      ownerEmail: signupData.email,
      ownerPhone: signupData.phone,
      ownerPassword: hashPassword(signupData.ownerPassword),
      staffPassword: hashPassword(signupData.staffPassword),
      createdAt: new Date().toISOString(),
      settings: {
        offlineMode: ['retailer', 'service'].includes(signupData.businessType),
        aiAssistantEnabled: false,
        theme: 'light',
        currency: 'USD',
        timeZone: 'UTC',
        language: 'en'
      }
    };

    // Create owner user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id: userId,
      name: signupData.ownerName,
      email: signupData.email,
      phone: signupData.phone,
      role: 'owner',
      businessId: businessId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    // Save to mock database
    businesses.push(business);
    users.push(user);

    // Generate tokens
    const tokens = generateTokens(user, business);

    const response: SignupResponse = {
      success: true,
      user,
      business,
      tokens
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Owner Signin
export const handleOwnerSignin: RequestHandler = (req, res) => {
  try {
    const signinData: OwnerSigninRequest = req.body;

    // Validate required fields
    if (!signinData.email || !signinData.ownerPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse<null>);
    }

    // Find business by owner email
    const business = businesses.find(b => 
      b.ownerEmail.toLowerCase() === signinData.email.toLowerCase()
    );

    if (!business) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse<null>);
    }

    // Verify owner password
    if (!verifyPassword(signinData.ownerPassword, business.ownerPassword)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse<null>);
    }

    // Find owner user
    const user = users.find(u => u.businessId === business.id && u.role === 'owner');

    if (!user) {
      return res.status(500).json({
        success: false,
        error: 'Owner user not found'
      } as ApiResponse<null>);
    }

    // Update last active
    user.lastActive = new Date().toISOString();

    // Generate tokens
    const tokens = generateTokens(user, business);

    const response: SigninResponse = {
      success: true,
      user,
      business,
      tokens
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Owner signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};

// Staff Signin
export const handleStaffSignin: RequestHandler = (req, res) => {
  try {
    const signinData: StaffSigninRequest = req.body;

    // Validate required fields
    if (!signinData.name || !signinData.businessName || !signinData.staffPassword ||
        !signinData.email || !signinData.phone || !signinData.role) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      } as ApiResponse<null>);
    }

    // Find business by name
    const business = businesses.find(b => 
      b.name.toLowerCase() === signinData.businessName.toLowerCase()
    );

    if (!business) {
      return res.status(401).json({
        success: false,
        error: 'Business not found or invalid credentials'
      } as ApiResponse<null>);
    }

    // Verify staff password
    if (!verifyPassword(signinData.staffPassword, business.staffPassword)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid staff password'
      } as ApiResponse<null>);
    }

    // Check if staff user already exists
    let user = users.find(u => 
      u.businessId === business.id && 
      u.email.toLowerCase() === signinData.email.toLowerCase()
    );

    if (!user) {
      // Create new staff user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id: userId,
        name: signinData.name,
        email: signinData.email,
        phone: signinData.phone,
        role: signinData.role,
        businessId: business.id,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      users.push(user);
    } else {
      // Update existing user information
      user.name = signinData.name;
      user.phone = signinData.phone;
      user.role = signinData.role;
      user.lastActive = new Date().toISOString();
    }

    // Generate tokens
    const tokens = generateTokens(user, business);

    const response: SigninResponse = {
      success: true,
      user,
      business,
      tokens
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Staff signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
};
