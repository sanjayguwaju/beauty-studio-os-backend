import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authRateLimit } from "../../middleware/rateLimit.middleware";
import { login, loginValidation, refresh, logout, me, forgotPassword, forgotPasswordValidation, resetPassword, resetPasswordValidation, requestOtp, requestOtpValidation, verifyOtp, verifyOtpValidation } from "./auth.controller";

const router = Router();

router.post("/login", authRateLimit, loginValidation, validate, login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

router.post("/forgot-password", authRateLimit, forgotPasswordValidation, validate, forgotPassword);
router.post("/reset-password", authRateLimit, resetPasswordValidation, validate, resetPassword);

router.post("/otp/request", authRateLimit, requestOtpValidation, validate, requestOtp);
router.post("/otp/verify", authRateLimit, verifyOtpValidation, validate, verifyOtp);

export default router;
