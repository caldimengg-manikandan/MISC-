// server/src/constants/status.constants.js
const STATUS = {
    NEW: "NEW",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    REVIEW: "REVIEW",
    SUBMITTED: "SUBMITTED",
    OVERDUE: "OVERDUE"
};

const STATUS_ACTIONS = {
    CREATE: "CREATED",
    ASSIGN: "ASSIGNED",
    START: "STARTED",
    REVIEW: "REVIEW_REQUESTED",
    SUBMIT: "SUBMITTED"
};

module.exports = {
    STATUS,
    STATUS_ACTIONS
};
