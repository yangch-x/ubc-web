
import { Spin } from 'antd';
import ReactDOM from 'react-dom';

const Loading = ({ spinning }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    }}
  >
    <Spin spinning={spinning} size="large" />
  </div>
);

const loadingRoot = document.createElement('div');
document.body.appendChild(loadingRoot);


const showLoading = () => {
  ReactDOM.render(<Loading spinning={true} />, loadingRoot);
};

const hideLoading = () => {
  ReactDOM.unmountComponentAtNode(loadingRoot);
};

export { hideLoading, showLoading };
