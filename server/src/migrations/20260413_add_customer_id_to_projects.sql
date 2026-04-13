-- Add customer_id to projects table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND name = 'customer_id')
BEGIN
    ALTER TABLE [dbo].[projects] ADD [customer_id] INT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE [dbo].[projects]
    ADD CONSTRAINT [fk_project_customer]
    FOREIGN KEY ([customer_id])
    REFERENCES [dbo].[customers] ([id]);
    
    PRINT 'Column customer_id added and FK constraint created.';
END
ELSE
BEGIN
    PRINT 'Column customer_id already exists.';
END
GO
