import { useEffect } from "react";
import { checkUserLogin } from "../../utils/user";

const CreatePost = () => {
  useEffect(() => {
    checkUserLogin();
  });

  return <div></div>;
};

export default CreatePost;
