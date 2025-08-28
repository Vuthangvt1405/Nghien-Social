import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Upload,
  Select,
  Switch,
  Space,
  message,
} from "antd";
import {
  UploadOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import Layout from "../../components/Layout";
import { Editor } from "@tinymce/tinymce-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useNavigate } from "react-router-dom";
import axios, { type AxiosResponse } from "axios";
import postService from "../../api/postService";
import toast from "react-hot-toast";

const { TextArea } = Input;

// Dữ liệu giả lập cho các community, bạn sẽ thay thế bằng API call sau này
const communityOptions = [
  { value: "general", label: "r/General" },
  { value: "reactjs", label: "r/ReactJS" },
  { value: "typescript", label: "r/TypeScript" },
  { value: "funny", label: "r/Funny" },
  { value: "webdev", label: "r/WebDev" },
];

const CreatePost: React.FC = () => {
  const [form] = Form.useForm();
  const [isLocked, setIsLocked] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const info = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  const onFinish = async (values: {
    title: string;
    caption?: string;
    content: string;
    community: string;
    tags?: string[];
    isLocked: boolean;
    password?: string;
  }) => {
    const postData = {
      ...values,
      cover: coverImageUrl,
      authorId: info.id,
    };
    try {
      // Định nghĩa kiểu dữ liệu trả về từ API
      type CreatePostResponse = {
        success: boolean;
        message?: string;
        post?: { id: string | number };
      };

      const response: AxiosResponse<CreatePostResponse> =
        await postService.createPost(postData);

      console.log(isLocked);
      console.log("Create post response:", response);

      if (isLocked) {
        // Handle locked post case
        await postService.encryptPostContent(
          response.data?.post?.id as number,
          postData.password as string
        );
        console.log("Post content encrypted", response.data?.post?.id);
      }

      const data = response.data;

      if (data.success) {
        message.success("Tạo bài viết thành công!");
        // Chuyển hướng đến trang bài viết vừa tạo
        // Giả sử API trả về id của bài viết mới
        navigate(`/posts/${data.post?.id}`);
      } else {
        message.error(data.message || "Tạo bài viết thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
      message.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  // const customUploadRequest = async (options: any) => {
  //   const { onSuccess, onError, file } = options;

  //   const fmData = new FormData();
  //   // Tên 'image' phải khớp với key mà server của bạn mong đợi
  //   fmData.append("source", file as RcFile);

  //   try {
  //     const res = await OtherService.uploadImageAndGetUrl(fmData);

  //     const imageUrl = res.data?.data.url; // Trích xuất URL từ response API
  //     setCoverImageUrl(imageUrl);
  //     onSuccess(res.data, file);
  //   } catch (err) {
  //     console.error("Lỗi khi tải ảnh lên:", err);
  //     message.error(
  //       "Tải ảnh lên thất bại. Vui lòng kiểm tra lại API endpoint và đảm bảo server đang chạy."
  //     );
  //     onError(err);
  //   }
  // };

  const customUploadRequest = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append("source", file);

      const url = await axios.post(
        "http://localhost:3000/api/getUrl",
        formData
      );
      console.log("Image URL:", url);
      setCoverImageUrl(url.data.data.display_url);
      onSuccess(url, file);
    } catch (err) {
      console.error("Error uploading image:", err);
      message.error("Failed to upload image. Please try again.");
      onError(err);
    }
  };

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);
      onFinish(values);
      toast.success("Post published successfully!");
    } catch (err) {
      toast.error("Please fill in the required fields.");
      console.error("Form validation error:", err);
    }
  };

  useEffect(() => {
    if (!info.username) navigate("/login");
  });
  return (
    <Layout>
      <div className="max-w-6xl px-4 py-8 mx-auto">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Create a New Post
        </h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isLocked: false }}
        >
          <Row gutter={24}>
            {/* Cột nội dung chính */}
            <Col xs={24} lg={16}>
              <Card title="Post Content" bordered={false} className="shadow-lg">
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[
                    {
                      required: true,
                      message: "Please input the post title!",
                    },
                  ]}
                >
                  <Input placeholder="Enter a catchy title" size="large" />
                </Form.Item>

                <Form.Item name="caption" label="Caption / Excerpt">
                  <TextArea
                    rows={2}
                    placeholder="A short, engaging summary of your post."
                  />
                </Form.Item>

                <Form.Item
                  name="content"
                  label="Main Content"
                  // The Editor component uses `onEditorChange` to signal changes.
                  // We need to tell Form.Item to use this event as the trigger for
                  // value updates and validation instead of the default `onChange`.
                  trigger="onEditorChange"
                  // We also specify how to get the value from the event's arguments.
                  getValueFromEvent={(content) => content}
                  rules={[
                    {
                      required: true,
                      message: "Nội dung chính không được để trống!",
                    },
                    // Custom validator to robustly check for empty content
                    () => ({
                      validator(_, value) {
                        // Thêm kiểm tra `typeof value` để tránh lỗi "replace is not a function"
                        if (typeof value !== "string" || !value) {
                          return Promise.reject(
                            new Error("Nội dung chính không được để trống!")
                          );
                        }
                        // Check for non-text elements that are considered content
                        const hasContentElements = /<img|<video|<hr/i.test(
                          value
                        );
                        // Check for actual text content, ignoring whitespace and &nbsp;
                        const textContent = value
                          .replace(/<[^>]*>/g, "")
                          .replace(/&nbsp;/g, " ")
                          .trim();

                        if (!hasContentElements && !textContent) {
                          return Promise.reject(
                            new Error("Nội dung chính không được để trống!")
                          );
                        }

                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY} // Lấy API key miễn phí từ tiny.cloud
                    init={{
                      height: 500,
                      menubar: false,
                      plugins:
                        "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount",
                      toolbar:
                        "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:16px }",
                      placeholder: "Write your amazing content here...",
                    }}
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Cột tùy chọn */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="large" className="w-full">
                <Card
                  title="Publishing Options"
                  bordered={false}
                  className="shadow-lg"
                >
                  <Form.Item>
                    <Button
                      onClick={handlePublish}
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                    >
                      Publish Post
                    </Button>
                  </Form.Item>
                </Card>

                <Card
                  title="Cover Image"
                  bordered={false}
                  className="shadow-lg"
                >
                  {/* Không bọc Upload.Dragger trong Form.Item vì chúng ta quản lý URL của nó
                  thông qua state `coverImageUrl` và customRequest, không phải qua state của Form.
                  Điều này tránh được các lỗi xung đột và validation không mong muốn. */}
                  <Upload.Dragger
                    name="file"
                    listType="picture"
                    maxCount={1}
                    customRequest={customUploadRequest}
                    showUploadList={true}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      A good cover image makes your post stand out.
                    </p>
                  </Upload.Dragger>
                </Card>

                <Card
                  title="Post Settings"
                  bordered={false}
                  className="shadow-lg"
                >
                  <Form.Item
                    name="community"
                    label="Choose a Community"
                    rules={[
                      {
                        required: true,
                        message: "Please select a community!",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Select a community"
                      options={communityOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.Item name="tags" label="Tags">
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Add tags to categorize your post"
                    />
                  </Form.Item>

                  <Form.Item
                    name="isLocked"
                    label="Lock Post"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren={<LockOutlined />}
                      unCheckedChildren={<UnlockOutlined />}
                      onChange={() => setIsLocked(!isLocked)}
                    />
                  </Form.Item>

                  {isLocked && (
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[
                        {
                          required: isLocked,
                          message: "Password is required for a locked post!",
                        },
                      ]}
                    >
                      <Input.Password placeholder="Enter a password" />
                    </Form.Item>
                  )}
                </Card>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    </Layout>
  );
};

export default CreatePost;
