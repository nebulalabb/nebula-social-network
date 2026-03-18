import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { sendEmail } from "../utils/email";
import { logger } from "../utils/logger";

export const emailWorker = new Worker(
  "notifications",
  async (job) => {
    logger.info(`[Worker] Processing job ${job.id} of type ${job.name}`);

    if (job.name === "sendOTP") {
      const { email, otp } = job.data;
      await sendEmail({
        email,
        subject: "Mã xác thực Anime Social của bạn",
        message: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`,
        html: `<b>Mã OTP của bạn là: <span style="font-size: 20px; color: #ff4081;">${otp}</span></b><p>Mã này có hiệu lực trong 10 phút.</p>`,
      });
    }

    if (job.name === "sendResetLink") {
      const { email, link } = job.data;
      await sendEmail({
        email,
        subject: "Khôi phục mật khẩu Anime Social",
        message: `Vui lòng click vào link sau để đặt lại mật khẩu của bạn: ${link}`,
        html: `
          <h3>Khôi phục mật khẩu</h3>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Anime Social.</p>
          <p>Vui lòng click vào nút bên dưới để thực hiện (link có hiệu lực trong 1 giờ):</p>
          <a href="${link}" style="background-color: #ff4081; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
          <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
        `,
      });
    }
  },
  { connection: redis as any }
);

emailWorker.on("completed", (job) => {
  logger.info(`[Worker] Job ${job.id} completed!`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
});
