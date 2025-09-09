import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelectionChange?: (selectedIds: string[], selectedItems: T[]) => void;
}

export function useBulkSelection<T>({ items, getItemId, onSelectionChange }: BulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item));
  }, [selectedIds, getItemId]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const isPartiallySelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  const toggleItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      const newSelectedItems = items.filter(item => newSet.has(getItemId(item)));
      onSelectionChange?.(Array.from(newSet), newSelectedItems);
      
      return newSet;
    });
  }, [getItemId, items, onSelectionChange]);

  const selectItem = useCallback((item: T) => {
    const id = getItemId(item);
    if (!selectedIds.has(id)) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        
        const newSelectedItems = items.filter(item => newSet.has(getItemId(item)));
        onSelectionChange?.(Array.from(newSet), newSelectedItems);
        
        return newSet;
      });
    }
  }, [getItemId, selectedIds, items, onSelectionChange]);

  const deselectItem = useCallback((item: T) => {
    const id = getItemId(item);
    if (selectedIds.has(id)) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        
        const newSelectedItems = items.filter(item => newSet.has(getItemId(item)));
        onSelectionChange?.(Array.from(newSet), newSelectedItems);
        
        return newSet;
      });
    }
  }, [getItemId, selectedIds, items, onSelectionChange]);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    setSelectedIds(allIds);
    onSelectionChange?.(Array.from(allIds), items);
  }, [items, getItemId, onSelectionChange]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([], []);
  }, [onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  const selectRange = useCallback((startItem: T, endItem: T) => {
    const startIndex = items.findIndex(item => getItemId(item) === getItemId(startItem));
    const endIndex = items.findIndex(item => getItemId(item) === getItemId(endItem));
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [start, end] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    const rangeItems = items.slice(start, end + 1);
    const rangeIds = rangeItems.map(getItemId);
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      rangeIds.forEach(id => newSet.add(id));
      
      const newSelectedItems = items.filter(item => newSet.has(getItemId(item)));
      onSelectionChange?.(Array.from(newSet), newSelectedItems);
      
      return newSet;
    });
  }, [items, getItemId, onSelectionChange]);

  const getSelectionStats = useMemo(() => {
    return {
      selectedCount: selectedIds.size,
      totalCount: items.length,
      selectedPercentage: items.length > 0 ? (selectedIds.size / items.length) * 100 : 0
    };
  }, [selectedIds.size, items.length]);

  // Bulk actions
  const performBulkAction = useCallback(async (
    action: (items: T[]) => Promise<void> | void,
    options?: {
      clearSelection?: boolean;
      confirmMessage?: string;
    }
  ) => {
    if (selectedItems.length === 0) return;

    const shouldProceed = options?.confirmMessage 
      ? window.confirm(options.confirmMessage) 
      : true;

    if (!shouldProceed) return;

    try {
      await action(selectedItems);
      
      if (options?.clearSelection !== false) {
        deselectAll();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      throw error;
    }
  }, [selectedItems, deselectAll]);

  return {
    // Selection state
    selectedIds: Array.from(selectedIds),
    selectedItems,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    
    // Selection actions
    toggleItem,
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    toggleAll,
    selectRange,
    
    // Bulk actions
    performBulkAction,
    
    // Stats
    getSelectionStats
  };
}
