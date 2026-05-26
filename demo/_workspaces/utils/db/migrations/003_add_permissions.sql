-- Migration: Add workspace permissions table
-- Description: Adds permission system for workspace items (folder, table, view)

-- Create workspace_permissions table
CREATE TABLE IF NOT EXISTS workspace_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL REFERENCES case_tree(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('read', 'readWrite', 'manage')),
  "grantedBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Ensure one permission record per user per item
  CONSTRAINT unique_user_item_permission UNIQUE ("itemId", "userId")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_permissions_item_id ON workspace_permissions("itemId");
CREATE INDEX IF NOT EXISTS idx_workspace_permissions_user_id ON workspace_permissions("userId");

-- Add comment for documentation
COMMENT ON TABLE workspace_permissions IS 'Stores user permissions for workspace items (folders, tables, views)';
COMMENT ON COLUMN workspace_permissions.role IS 'Permission level: read, readWrite, or manage';
