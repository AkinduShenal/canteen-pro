export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be done by protect middleware first)
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user's role is in the allowedRoles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role (${req.user.role}) is not allowed to access this resource`
      });
    }

    next();
  };
};
