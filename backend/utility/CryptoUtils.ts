import CryptoJS from "crypto-js";

export class CryptoUtils {
  static encrypt = (text: string, key: string): string => {
    const ciphertext = CryptoJS.AES.encrypt(text, key).toString();
    return ciphertext;
  };

  static decrypt = (ciphertext: string, key: string): string | undefined => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      if (bytes.sigBytes > 0) {
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedText as string;
      } else {
        throw new Error("Decryption failed: Invalid ciphertext or key.");
      }
    } catch (error) {
      throw new Error(
        "Decryption failed. Please check the key and ciphertext."
      );
    }
  };
}
