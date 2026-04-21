/**
 * chatRepository.js
 * Database operations for persisting AI conversations.
 */

const db = require('../../config/mssql');

const chatRepo = {
    /**
     * Get recent chats for a user
     */
    getRecentChats: async (userId, limit = 10) => {
        const [rows] = await db.query(
            'SELECT TOP (@limit) id, title, createdAt, updatedAt FROM agent_chats WHERE userId = @userId ORDER BY updatedAt DESC',
            { userId, limit }
        );
        return rows;
    },

    /**
     * Create a new chat thread
     */
    createChat: async (userId, title) => {
        const [result] = await db.query(
            'INSERT INTO agent_chats (userId, title) OUTPUT INSERTED.id VALUES (@userId, @title)',
            { userId, title: title || 'New Conversation' }
        );
        return result[0].id;
    },

    /**
     * Add a message to a chat
     */
    addMessage: async (chatId, { role, content, tool, source, intent }) => {
        await db.query(
            'INSERT INTO agent_chat_messages (chatId, [role], content, tool, source, intent) VALUES (@chatId, @role, @content, @tool, @source, @intent)',
            { chatId, role, content, tool, source, intent }
        );
        // Update chat updatedAt
        await db.query('UPDATE agent_chats SET updatedAt = GETDATE() WHERE id = @id', { id: chatId });
    },

    /**
     * Get full history of a chat
     */
    getChatHistory: async (chatId) => {
        const [rows] = await db.query(
            'SELECT role, content, tool, source, intent, createdAt FROM agent_chat_messages WHERE chatId = @chatId ORDER BY createdAt ASC',
            { chatId }
        );
        return rows;
    },

    /**
     * Delete a chat
     */
    deleteChat: async (chatId) => {
        await db.query('DELETE FROM agent_chats WHERE id = @id', { id: chatId });
    },

    /**
     * Update chat title
     */
    updateTitle: async (chatId, title) => {
        await db.query('UPDATE agent_chats SET title = @title WHERE id = @id', { id: chatId, title });
    }
};

module.exports = chatRepo;
