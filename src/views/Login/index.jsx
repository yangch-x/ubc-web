import { Form } from 'freedomen';
import { useState } from 'react';
import util, { history } from 'libs/util';
import loginService from 'services/Login';
import styles from './index.module.less';

export default function Login() {
  const [loading, setLoading] = useState(false);
  return (
    <div className={styles['freedomen-page']}>
      <Form
        className={styles['form']}
        onSubmit={(data) => {
          setLoading(true);
          loginService
            .login(data)
            .then((res) => {
              const { data = {} } = res;
              if (data.token) {
                util.setToken(data.token);
                localStorage.setItem('token', data.token); // 保存 token
              }
              if (data.userId) {
                util.setUserId(data.userId);
              }
              history.replace('/shipment');
            })
            .catch((e) => {
              setLoading(false);
            });
        }}
        columns={[
          {
            type: 'text-div',
            value: '账号登录',
            className: styles['text-div'],
          },
          {
            type: 'input',
            prop: 'name',
            placeholder: '请输入用户名',
            rule: { must: '用户名不能为空' },
            className: styles['name'],
          },
          {
            type: 'input-password',
            prop: 'password',
            placeholder: '请输入密码',
            rule: { must: '密码不能为空' },
            config: { submitEventType: 'pressEnter' },
            className: styles['password'],
          },
          [
            {
              type: 'button-primary',
              prop: '$submit',
              value: '登录',
              config: { shape: 'round', loading: loading },
              className: styles['drsubmit'],
            },
            { type: 'div', className: styles['div'] },
          ],
        ]}
      />
    </div>
  );
}
