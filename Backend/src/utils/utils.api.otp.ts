import crypto from "crypto";

const otpGenerator = () => {
    return crypto.randomInt(100000, 1000000).toString(); // 100000–999999 inclusive
};

export default otpGenerator;