
-- agent_chats Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[agent_chats]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[agent_chats](
        [id] [bigint] IDENTITY(1,1) NOT NULL,
        [userId] [bigint] NOT NULL,
        [title] [nvarchar](255) NULL,
        [createdAt] [datetime] DEFAULT GETDATE(),
        [updatedAt] [datetime] DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END

-- agent_chat_messages Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[agent_chat_messages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[agent_chat_messages](
        [id] [bigint] IDENTITY(1,1) NOT NULL,
        [chatId] [bigint] NOT NULL,
        [role] [nvarchar](50) NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [tool] [nvarchar](255) NULL,
        [source] [nvarchar](255) NULL,
        [intent] [nvarchar](50) NULL,
        [createdAt] [datetime] DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_agent_chat_messages_chats] FOREIGN KEY([chatId])
        REFERENCES [dbo].[agent_chats] ([id]) ON DELETE CASCADE
    );
END
