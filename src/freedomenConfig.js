import * as systemConfig from './systemConfig';
import * as util from 'libs/util';
import Freedomen from 'freedomen';
import * as ExFreedomen from 'ex-freedomen';

const getCustomComponent = (Component, eventNames = []) => {
  return ({
    value,
    $base: {
      placeholder,
      style,
      className,
      onChange,
      disabeld,
      onEvent,
      config,
    },
  }) => {
    const events = {};
    eventNames.forEach((name) => {
      events[name] = (value) => onEvent(name, value);
    });

    return (
      <Component
        value={value}
        placeholder={placeholder}
        style={style}
        className={className}
        onChange={onChange}
        disabeld={disabeld}
        config={config}
        {...events}
      />
    );
  };
};
Freedomen.setDefaultConfigs(() => {
  return {
    Form: {
      labelCol: {
        span: 4,
      },
    },
    'input,input@*,input-*': {
      allowClear: true,
      changeEventType: 'blur',
    },
    'select*': {
      allowClear: true,
    },
    //上传路径相同，全局配置
    'upload*': {
      action: `${systemConfig.baseURL}/common/upload`,
      headers: {
        //如果你使用的不是token名，改更改
        Authorization: `Bearer ${util.getToken()}`,
      },
      //res是接口返回的数据，返回结构
      onSuccess: (res) => res,
      //filter是对数据显示，如返回的是uid,前置路径相同
      //   filter: ({ value }) => `preUrl/${value}`,
    },
  };
});
