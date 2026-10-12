/** Roles returned on Feature 1 login (`user.role` in localStorage). */
export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
};

export const isStudent = (user) => user?.role === ROLES.STUDENT;
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
