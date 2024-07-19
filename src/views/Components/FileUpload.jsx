import { Upload } from 'antd';
import * as util from 'libs/util';
import * as systemConfig from 'systemConfig';

const buildQueryString = (params) => {
  return new URLSearchParams(params).toString();
};

const FileUpload = ({ children, onChange, uploadParams }) => {
  const queryString = uploadParams ? `?${buildQueryString(uploadParams)}` : '';
  const actionUrl = `${systemConfig.baseURL}/common/upload${queryString}`;

  return (
    <Upload
      action={actionUrl}
      headers={{
        Authorization: `Bearer ${util.getToken()}`,
      }}
      onChange={onChange}
    >
      {children}
    </Upload>
  );
};

export default FileUpload;
