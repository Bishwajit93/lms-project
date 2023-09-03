// Middleware for checking if a user is an instructor
export function isInstructor(req, res, next) {
    if (req.user && req.user.role === 'Instructor') {
      return next(); // User is an instructor, allow access
    } else {
      return res.status(403).json({ message: 'Access denied. Requires instructor role.' });
    }
}
  
// Middleware for checking if a user is a TA
export function isTA(req, res, next) {
    if (req.user && req.user.role === 'TA') {
      return next(); // User is a TA, allow access
    } else {
      return res.status(403).json({ message: 'Access denied. Requires TA role.' });
    }
}
  
// Middleware for checking if a user is part of the student body
export function isStudentBody(req, res, next) {
    if (req.user && req.user.role === 'Student Body') {
      return next(); // User is part of the student body, allow access
    } else {
      return res.status(403).json({ message: 'Access denied. Requires Student Body role.' });
    }
}
  
  // Middleware for checking if a user is a student
export function isStudent(req, res, next) {
    if (req.user && req.user.role === 'Student') {
      return next(); // User is a student, allow access
    } else {
      return res.status(403).json({ message: 'Access denied. Requires student role.' });
    }
}
  