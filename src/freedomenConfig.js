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
    // 上传路径相同，全局配置
    'upload*': {
      headers: {
        Authorization: `Bearer ${util.getToken()}`,
      },
    },
  };
});
