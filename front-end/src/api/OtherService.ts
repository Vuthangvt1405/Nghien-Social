import apiService from "./apiService";

class OtherService {
  uploadImageAndGetUrl(picture) {
    const formData = new FormData();
    formData.append("source", picture);
    return apiService.post("/getUrl", formData);
  }
}

export default new OtherService();
