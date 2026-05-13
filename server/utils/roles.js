import User from "../models/User.js";

export const getAdminEmails = () => {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((adminEmail) =>
      adminEmail.trim().toLowerCase()
    )
    .filter(Boolean);
};

export const resolveRoleForEmail = async (
  email
) => {
  const adminEmails = getAdminEmails();

  if (adminEmails.includes(email.toLowerCase())) {
    return "admin";
  }

  const adminExists = await User.exists({
    role: "admin",
  });

  return adminExists ? "user" : "admin";
};

export const ensureUserRole = async (user) => {
  if (user.role === "admin") {
    return user;
  }

  const resolvedRole = await resolveRoleForEmail(
    user.email
  );

  if (user.role === resolvedRole) {
    return user;
  }

  user.role = resolvedRole;
  await user.save();

  return user;
};
