import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { useState, useCallback, useEffect } from 'react';
import {
  message,
  Modal,
  Table as AntTable,
  Button,
  Input,
  InputNumber,
} from 'antd';
import projectionService from 'services/ProjectionPo';
import styles from './index.module.less';
import * as systemConfig from 'systemConfig';

export default function Shipment() {
  const [searchParams, setSearchParams] = useState({
    pageNo: 1,
    pageSize: 10,
  });

  const [tableData, setTableData] = useState([]);
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState();
  const [pagination, setPagination] = useState({ total: 0 });
  const [poItemsModalVisible, setPoItemsModalVisible] = useState(false);
  const [currentPoItems, setCurrentPoItems] = useState([]);
  const [currentPoNumber, setCurrentPoNumber] = useState('');
  const [currentRowData, setCurrentRowData] = useState(null);
  const [editablePoItems, setEditablePoItems] = useState([]);

  // 添加表格内编辑相关状态
  const [editingKeys, setEditingKeys] = useState([]);
  const [editingData, setEditingData] = useState({});
  const [originalData, setOriginalData] = useState({}); // 新增：保存原始数据用于比较

  const loadData = useCallback(() => {
    console.log('loadData called');
    setLoading(true);
    console.log('searchParams:', searchParams);
    projectionService
      .search(searchParams)
      .then((res) => {
        console.log('Response is successful:', res);

        setLoading(false);
        console.log('search response:', res);
        console.log(res);
        setPagination({
          total: res.data.total,
          pageNo: res.data.pageNo,
          pageSize: res.data.pageSize,
        });
        setTableData(res.data.res);
        setSelection([]);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  }, [searchParams]);

  const searchEvent = (params) => {
    if (params.prop === 'search' && params.type === 'click') {
      const searchData = { ...params.row };

      // 如果有dueDate且是时间戳，转换为YYYY-MM-DD格式的字符串
      if (searchData.dueDate && typeof searchData.dueDate === 'number') {
        const date = new Date(searchData.dueDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        searchData.dueDate = `${year}-${month}-${day}`;
      }

      setSearchParams(searchData);
    }
  };
  const regionEvent = (params) => {
    if (params.prop === 'add' && params.type === 'click') {
      Dialog.open('fdialog', '新增').then((set) =>
        set(getDialogForm(params.row))
      );
    } else if (params.prop === 'dels' && params.type === 'click') {
      Modal.confirm({
        content: '确定要删除选中的' + selection.length + '条数据？',
        onOk() {
          projectionService
            .batchremove({ ids: selection.map((el) => el.id) })
            .then((res) => {
              if (res.code !== 200) {
                message.error(`${res.msg}`);
                return;
              }
              message.success('删除成功！');
              loadData();
            })
            .catch((error) => {
              console.error(error);
              message.error('删除失败');
            });
        },
      });
    } else if (params.prop === 'export' && params.type === 'click') {
      if (selection.length === 0) {
        message.warning('请先选择要导出的数据！');
        return;
      }
      projectionService
        .downloadProjectionPo({ selection })
        .then((res) => {
          const blob = new Blob([res], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'po.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          message.success('下载成功！');
        })
        .catch((error) => {
          console.error(error);
          message.error('下载失败！');
        });
    }
  };
  const handlePoClick = (row) => {
    // 在这里打印一下row，看看它的结构
    console.log('handlePoClick row:', row);

    // 如果row不是行数据，而是事件对象，我们需要从tableData中找到对应的行
    let rowData = row;
    if (!row.poItems && row.customerPo) {
      // 尝试从tableData中找到匹配的行
      rowData =
        tableData.find((item) => item.customerPo === row.customerPo) || row;
    }

    // 检查poItems是否存在，并尝试解析JSON字符串
    let poItems = [];
    if (rowData.poItems) {
      try {
        // 如果poItems是字符串，尝试解析它
        if (typeof rowData.poItems === 'string') {
          poItems = JSON.parse(rowData.poItems);
        } else {
          // 如果已经是数组，直接使用
          poItems = rowData.poItems;
        }
      } catch (error) {
        console.error('解析poItems失败:', error);
        message.error('解析数据失败');
      }
    }

    console.log('poItems:', poItems);

    setCurrentPoItems(poItems);
    setEditablePoItems([...poItems]); // 创建一个可编辑的副本
    setCurrentRowData(rowData); // 保存当前行数据，用于保存时更新
    setCurrentPoNumber(rowData.customerPo);
    setPoItemsModalVisible(true);
  };

  // 开始编辑某一行
  const handleEdit = (record) => {
    console.log('开始编辑，原始记录:', record);

    // 创建一个干净的数据副本，只保留需要的字段
    const cleanRecord = { ...record };

    setEditingKeys([...editingKeys, record.id]);
    setEditingData({
      ...editingData,
      [record.id]: cleanRecord,
    });
    // 保存原始数据用于比较
    setOriginalData({
      ...originalData,
      [record.id]: cleanRecord,
    });

    console.log('保存的原始数据:', cleanRecord);
  };

  // 取消编辑
  const handleCancelEdit = (id) => {
    setEditingKeys(editingKeys.filter((key) => key !== id));
    const newEditingData = { ...editingData };
    const newOriginalData = { ...originalData };
    delete newEditingData[id];
    delete newOriginalData[id];
    setEditingData(newEditingData);
    setOriginalData(newOriginalData);
  };

  // 获取修改的字段
  const getChangedFields = (id) => {
    const original = originalData[id];
    const edited = editingData[id];

    if (!original || !edited) return null;

    const changedFields = { id }; // 始终包含ID字段

    console.log('比较原始数据:', original);
    console.log('比较编辑数据:', edited);

    // 排除计算字段的列表
    const calculatedFields = ['poQty', 'ttlBuy'];

    // 比较每个字段
    Object.keys(edited).forEach((key) => {
      // 跳过计算字段
      if (calculatedFields.includes(key)) {
        console.log(`跳过计算字段: ${key}`);
        return;
      }

      const originalValue = original[key];
      const editedValue = edited[key];

      // 对数字字段进行类型转换比较
      const isNumberField = ['costPrice', 'salePrice', 'ttlSell'].includes(key);

      let hasChanged = false;

      if (isNumberField) {
        // 数字字段：转换为数字进行比较
        const originalNum = Number(originalValue) || 0;
        const editedNum = Number(editedValue) || 0;
        hasChanged = originalNum !== editedNum;

        console.log(
          `字段 ${key} (数字): 原始=${originalNum}, 编辑=${editedNum}, 变化=${hasChanged}`
        );
      } else {
        // 字符串字段：转换为字符串进行比较
        const originalStr = String(originalValue || '');
        const editedStr = String(editedValue || '');
        hasChanged = originalStr !== editedStr;

        console.log(
          `字段 ${key} (字符串): 原始="${originalStr}", 编辑="${editedStr}", 变化=${hasChanged}`
        );
      }

      if (hasChanged) {
        changedFields[key] = editedValue;
      }
    });

    console.log('检测到的变化字段:', changedFields);

    // 如果只有ID字段，说明没有修改
    if (Object.keys(changedFields).length === 1) {
      console.log('没有检测到字段修改');
      return null;
    }

    return changedFields;
  };

  // 保存编辑
  const handleSaveEdit = (id) => {
    const changedFields = getChangedFields(id);

    if (!changedFields) {
      message.info('没有检测到字段修改');
      handleCancelEdit(id);
      return;
    }

    console.log('将要保存的修改字段:', changedFields);

    projectionService
      .updateFields(changedFields)
      .then((res) => {
        if (res.code !== 200) {
          message.error(`${res.msg}`);
          return;
        }
        message.success('保存成功！');
        handleCancelEdit(id);
        loadData();
      })
      .catch((error) => {
        console.error(error);
        message.error('保存失败');
      });
  };

  // 处理编辑中的数据变更
  const handleEditDataChange = (id, field, value) => {
    console.log(
      `字段变更: id=${id}, field=${field}, value=${value}, type=${typeof value}`
    );

    setEditingData({
      ...editingData,
      [id]: {
        ...editingData[id],
        [field]: value,
      },
    });
  };

  // 判断是否正在编辑
  const isEditing = (record) => editingKeys.includes(record.id);

  // 计算PO Items中所有QTY的总和
  const calculateTotalQty = (poItems) => {
    if (!poItems) return 0;

    let items = [];
    try {
      if (typeof poItems === 'string') {
        items = JSON.parse(poItems);
      } else if (Array.isArray(poItems)) {
        items = poItems;
      }
    } catch (error) {
      console.error('解析poItems失败:', error);
      return 0;
    }

    return items.reduce((total, item) => {
      const qty = Number(item.qTY) || 0;
      return total + qty;
    }, 0);
  };

  // 计算TTL BUY (QTY/PC * ￥ BUY)
  const calculateTtlBuy = (record) => {
    const totalQty = calculateTotalQty(record.poItems);
    const costPrice = Number(record.costPrice) || 0;
    return totalQty * costPrice;
  };

  // 渲染可编辑单元格
  const renderEditableCell = (text, record, field, type = 'input') => {
    const editing = isEditing(record);

    // QTY/PC 和 TTL BUY 字段不允许编辑，显示计算值
    if (field === 'poQty') {
      const calculatedQty = calculateTotalQty(record.poItems);
      return <span>{calculatedQty}</span>;
    }

    if (field === 'ttlBuy') {
      const calculatedTtlBuy = calculateTtlBuy(record);
      return <span>{calculatedTtlBuy.toFixed(2)}</span>;
    }

    let value = editing ? editingData[record.id]?.[field] : text;

    if (!editing) {
      return text;
    }

    if (type === 'number') {
      // 确保数字值的正确显示
      const numValue =
        value !== undefined && value !== null ? Number(value) : undefined;

      return (
        <InputNumber
          value={numValue}
          onChange={(val) => handleEditDataChange(record.id, field, val)}
          style={{ width: '100%' }}
          placeholder="请输入数字"
        />
      );
    }

    // 确保字符串值的正确显示
    const strValue = value !== undefined && value !== null ? String(value) : '';

    return (
      <Input
        value={strValue}
        onChange={(e) => handleEditDataChange(record.id, field, e.target.value)}
        style={{ width: '100%' }}
        placeholder="请输入内容"
      />
    );
  };

  // PO Items 模态框相关函数
  // 处理表格中单元格的编辑
  const handleCellChange = (value, record, dataIndex, index) => {
    const newData = [...editablePoItems];
    newData[index][dataIndex] = value;
    setEditablePoItems(newData);
  };

  // 删除PO Item行
  const handleDeletePoItem = (index) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这行数据吗？',
      onOk() {
        const newData = [...editablePoItems];
        newData.splice(index, 1);
        setEditablePoItems(newData);
        message.success('删除成功！');
      },
    });
  };

  // 保存编辑后的数据
  const handleSavePoItems = () => {
    if (!currentRowData) {
      message.error('无法获取当前行数据');
      return;
    }

    // 直接保存PO Items，不进行修改检测
    const changedData = {
      id: currentRowData.id,
      poItems: JSON.stringify(editablePoItems),
    };

    console.log('保存 PO Items 数据:', changedData);

    // 调用新的updateFields接口，保持与表格编辑一致
    projectionService
      .updateFields(changedData)
      .then((res) => {
        if (res.code !== 200) {
          message.error(`${res.msg}`);
          return;
        }
        message.success('保存成功！');
        setPoItemsModalVisible(false);
        loadData(); // 重新加载数据
      })
      .catch((error) => {
        console.error(error);
        message.error('保存失败');
      });
  };

  const tableEvent = (params) => {
    if (params.prop === 'edit' && params.type === 'click') {
      handleEdit(params.row);
    } else if (params.prop === 'save' && params.type === 'click') {
      handleSaveEdit(params.row.id);
    } else if (params.prop === 'cancel' && params.type === 'click') {
      handleCancelEdit(params.row.id);
    } else if (params.prop === 'exportPdf' && params.type === 'click') {
      // 导出单行数据为PDF
      projectionService
        .downloadProjectionPoPdf({ selection: [params.row] })
        .then((response) => {
          // 详细调试信息
          console.log('完整响应对象:', response);
          console.log('响应头对象:', response.headers);
          console.log('所有响应头keys:', Object.keys(response.headers || {}));

          // 从响应头中获取文件名
          let filename = `po_${params.row.customerPo || 'data'}.pdf`; // 默认文件名

          // 尝试多种方式获取Content-Disposition
          const headers = response.headers || {};

          // 检查所有可能的Content-Disposition键名（包括大小写变体）
          const possibleKeys = [
            'content-disposition',
            'Content-Disposition',
            'content-Disposition',
            'CONTENT-DISPOSITION',
            'Content-disposition',
          ];

          let contentDisposition = null;
          for (const key of possibleKeys) {
            if (headers[key]) {
              contentDisposition = headers[key];
              console.log(
                `找到Content-Disposition (${key}):`,
                contentDisposition
              );
              break;
            }
          }

          // 如果通过普通方式找不到，尝试遍历所有响应头
          if (!contentDisposition && headers) {
            for (const [key, value] of Object.entries(headers)) {
              if (key.toLowerCase().includes('disposition')) {
                contentDisposition = value;
                console.log(`通过遍历找到响应头 (${key}):`, value);
                break;
              }
            }
          }

          console.log('最终Content-Disposition:', contentDisposition);

          if (contentDisposition && typeof contentDisposition === 'string') {
            // 更精确的文件名提取逻辑
            let match;

            // 首先尝试匹配带双引号的文件名: filename="文件名.pdf"
            match = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
            if (match && match[1]) {
              filename = match[1];
              console.log('提取到带双引号的文件名:', filename);
            } else {
              // 其次尝试匹配带单引号的文件名: filename='文件名.pdf'
              match = contentDisposition.match(/filename\s*=\s*'([^']+)'/i);
              if (match && match[1]) {
                filename = match[1];
                console.log('提取到带单引号的文件名:', filename);
              } else {
                // 最后尝试匹配不带引号的文件名: filename=文件名.pdf
                match = contentDisposition.match(/filename\s*=\s*([^;\s]+)/i);
                if (match && match[1]) {
                  filename = match[1];
                  console.log('提取到不带引号的文件名:', filename);
                }
              }
            }
          } else {
            console.log(
              '警告: 无法从响应头获取Content-Disposition，使用默认文件名'
            );
            console.log(
              '这可能是由于CORS配置问题，后端需要设置: Access-Control-Expose-Headers: Content-Disposition'
            );
          }

          console.log('最终使用的文件名:', filename);

          const blob = new Blob([response.data], {
            type: 'application/pdf',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          message.success('PDF导出成功！');
        })
        .catch((error) => {
          console.error('PDF导出错误:', error);
          message.error('PDF导出失败！');
        });
    } else if (params.prop === 'pdel' && params.type === 'confirm') {
      const { id } = params.row;

      projectionService
        .remove({ projID: id })
        .then((res) => {
          if (res.code !== 200) {
            message.error(`${res.msg}`); // 显示错误消息
            return;
          }
          message.success('删除成功！');
          loadData();
        })
        .catch((error) => {
          setLoading(false);
          console.error(error);
        });
    } else if (params.prop === '$page') {
      setSearchParams({
        ...searchParams,
        pageNo: params.value.pageNo,
        pageSize: params.value.pageSize,
      });
    } else if (params.prop === '$selection') {
      setSelection(params.value);
    } else if (params.prop === 'customerPo' && params.type === 'click') {
      handlePoClick(params.row);
    }
  };
  const getDialogForm = (formData) => {
    return (
      <Form
        config={{ labelCol: { span: 8 } }}
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          // 合并原始数据和表单数据，确保不丢失任何原始字段
          const submitData = { ...formData, ...data };
          projectionService
            .saveOrUpdate(submitData)
            .then((res) => {
              //也可以根据是否有 id 不同提示
              message.success('操作成功！');
              loadData();
              Dialog.close('fdialog');
            })
            .catch((e) => {
              Dialog.loading('fdialog', false);
            });
        }}
        data={formData}
        columns={[
          {
            type: 'input@w200',
            prop: 'arriveDt',
            label: 'Ex-FTY/In House',
            disabled: ({ value, data }) => {},
          },
          {
            type: 'input@w200',
            prop: 'customerCode',
            label: 'CUSTOMER',
            config: { allowClear: true },
          },
          {
            type: 'input@w200',
            prop: 'customerPo',
            label: 'CUSTOMER P.O.',
            config: { allowClear: false },
          },
          {
            type: 'input@w200',
            prop: 'styleCode',
            label: 'STYLE NO',
          },
          {
            type: 'input@w200',
            prop: 'styleName',
            label: 'DESC/STYLE NAME',
          },
          {
            type: 'input@w200',
            prop: 'color',
            label: 'COLOR',
          },
          {
            type: 'input@w200',
            prop: 'fabrication',
            label: 'FABRICATION',
          },
          {
            type: 'inputnumber@w200',
            prop: 'poQty',
            label: 'QTY/PC',
          },
          {
            type: 'inputnumber@w200',
            prop: 'costPrice',
            label: '￥ BUY',
          },
          {
            type: 'inputnumber@w200',
            prop: 'ttlBuy',
            label: 'TTL BUY',
          },
          {
            type: 'inputnumber@w200',
            prop: 'salePrice',
            label: '$ SELL',
          },
          {
            type: 'inputnumber@w200',
            prop: 'ttlSell',
            label: 'TTL SELL',
          },
          {
            type: 'input@w200',
            prop: 'exporter',
            label: 'VENDOR',
          },
          {
            type: 'input@w200',
            prop: 'waterResistant',
            label: 'WATER RESISTANT / Y/N',
          },
          {
            type: 'input@w200',
            prop: 'notes',
            label: 'NOTE',
          },
          {
            type: 'input@w200',
            prop: 'country',
            label: 'Country&Brand ID',
          },
        ]}
      />
    );
  };
  const poItemColumns = [
    {
      title: 'PO#',
      dataIndex: 'PO#',
      key: 'PO#',
      width: 120,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'PO#', index)
          }
        />
      ),
    },
    {
      title: 'QTY',
      dataIndex: 'qTY',
      key: 'qTY',
      width: 100,
      render: (text, record, index) => (
        <InputNumber
          value={text}
          style={{ width: '100%' }}
          onChange={(value) =>
            handleCellChange(String(value || ''), record, 'qTY', index)
          }
        />
      ),
    },
    {
      title: 'SIZE',
      dataIndex: 'sIZE',
      key: 'sIZE',
      width: 100,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'sIZE', index)
          }
        />
      ),
    },
    {
      title: 'UPC#',
      dataIndex: 'UPC#',
      key: 'UPC#',
      width: 150,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'UPC#', index)
          }
        />
      ),
    },
    {
      title: 'COLOR',
      dataIndex: 'cOLOR',
      key: 'cOLOR',
      width: 120,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'cOLOR', index)
          }
        />
      ),
    },
    {
      title: 'STYLE',
      dataIndex: 'sTYLE',
      key: 'sTYLE',
      width: 120,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'sTYLE', index)
          }
        />
      ),
    },
    {
      title: 'DIMENSION',
      dataIndex: 'dIMENSION',
      key: 'dIMENSION',
      width: 130,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'dIMENSION', index)
          }
        />
      ),
    },
    {
      title: 'COLOR DESCRIPTION',
      dataIndex: 'COLOR DESCRIPTION',
      key: 'colorDesc',
      width: 150,
      render: (text, record, index) => (
        <Input
          value={text}
          style={{ width: '100%' }}
          onChange={(e) =>
            handleCellChange(e.target.value, record, 'COLOR DESCRIPTION', index)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (text, record, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeletePoItem(index)}
        >
          删除
        </Button>
      ),
    },
  ];
  useEffect(() => {
    loadData();
  }, [loadData]);
  return (
    <div className={'freedomen-page'}>
      <Search
        className={'f-search'}
        onEvent={searchEvent}
        columns={[
          {
            type: 'input',
            prop: 'searchParams',
            label: '',
            placeholder: 'Customer Code&Po',
          },
          {
            type: 'date',
            prop: 'dueDate',
            label: '',
            placeholder: 'Due Date',
            config: {
              allowClear: true,
              format: 'YYYY-MM-DD',
              valueFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'button-primary',
            prop: 'search',
            value: 'search',
            config: { icon: <SearchOutlined /> },
          },
        ]}
      />
      <Region
        onEvent={regionEvent}
        columns={[
          [
            {
              type: 'button-primary',
              prop: 'add',
              value: '新增',
              config: { icon: <PlusOutlined /> },
            },
            {
              type: 'button-primary',
              prop: 'export',
              value: '导出',
              config: { icon: <DownloadOutlined /> },
            },
            {
              type: 'upload-primary',
              prop: 'upload',
              config: {
                action: `${systemConfig.baseURL}/common/upload?usedFor=po`,
                onSuccess: (res) => {
                  if (res.code === 200) {
                    loadData();
                  } else {
                    message.error(`Error: ${res.msg}`);
                  }
                  console.log(res);
                },
              },
            },
            {
              type: 'button',
              prop: 'dels',
              value: '删除选中',
              load: ({ value, data }) => {
                return selection.length;
              },
              config: { danger: true, icon: <DeleteOutlined /> },
            },
            { type: 'space' },
          ],
        ]}
      />
      <Table
        className={'f-table'}
        data={tableData}
        onEvent={tableEvent}
        pagination={pagination}
        config={{ selection: true, loading: loading }}
        columns={[
          {
            type: 'text',
            prop: 'arriveDt',
            label: 'Ex-FTY/In House',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'arriveDt'),
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: 'CUSTOMER',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'customerCode'),
          },
          {
            type: 'button-link',
            prop: 'customerPo',
            label: 'CUSTOMER P.O.',
            value: ({ customerPo }) => customerPo || '',
            render: ({ value, data }) => {
              const editing = isEditing(data);
              if (editing) {
                return renderEditableCell(value, data, 'customerPo');
              }
              return (
                <Button
                  type="link"
                  onClick={() => handlePoClick(data)}
                  style={{ padding: 0 }}
                >
                  {value}
                </Button>
              );
            },
          },
          {
            type: 'text',
            prop: 'styleCode',
            label: 'STYLE NO',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'styleCode'),
          },
          {
            type: 'text',
            prop: 'styleName',
            label: 'DESC/STYLE NAME',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'styleName'),
          },
          {
            type: 'text',
            prop: 'color',
            label: 'COLOR',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'color'),
          },
          {
            type: 'text',
            prop: 'fabrication',
            label: 'FABRICATION',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'fabrication'),
          },
          {
            type: 'text',
            prop: 'poQty',
            label: 'QTY/PC',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'poQty', 'number'),
          },
          {
            type: 'text',
            prop: 'costPrice',
            label: '￥ BUY',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'costPrice', 'number'),
          },
          {
            type: 'text',
            prop: 'ttlBuy',
            label: 'TTL BUY',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'ttlBuy', 'number'),
          },
          {
            type: 'text',
            prop: 'salePrice',
            label: '$ SELL',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'salePrice', 'number'),
          },
          {
            type: 'text',
            prop: 'ttlSell',
            label: 'TTL SELL',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'ttlSell', 'number'),
          },
          {
            type: 'text',
            prop: 'exporter',
            label: 'VENDOR',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'exporter'),
          },
          {
            type: 'text',
            prop: 'waterResistant',
            label: 'WATER RESISTANT / Y/N',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'waterResistant'),
          },
          {
            type: 'text',
            prop: 'notes',
            label: 'NOTE',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'notes'),
          },
          {
            type: 'text',
            prop: 'country',
            label: 'Country&Brand ID',
            render: ({ value, data }) =>
              renderEditableCell(value, data, 'country'),
          },

          {
            label: '操作',
            width: 260,
            render({ data }) {
              const editing = isEditing(data);

              if (editing) {
                return [
                  {
                    type: 'button-link',
                    prop: 'save',
                    value: '保存',
                    config: { icon: <SaveOutlined /> },
                    className: styles['save'],
                  },
                  {
                    type: 'button-link',
                    prop: 'cancel',
                    value: '取消',
                    config: { icon: <CloseOutlined /> },
                    className: styles['cancel'],
                  },
                  { type: 'space' },
                ];
              }

              return [
                {
                  type: 'button-link',
                  prop: 'edit',
                  value: '编辑',
                  config: { icon: <EditOutlined /> },
                  className: styles['edit'],
                },
                {
                  type: 'button-link',
                  prop: 'exportPdf',
                  value: '导出PDF',
                  className: styles['exportPdf'],
                },
                [
                  {
                    type: 'button-link',
                    prop: 'del',
                    value: '删除',
                    config: { danger: true },
                    className: styles['del'],
                  },
                  {
                    type: 'popconfirm',
                    prop: 'pdel',
                    value: '确定要删除该数据？',
                  },
                ],
                { type: 'space', config: { fixed: 'right' } },
              ];
            },
          },
          {
            render() {
              return <Region columns={[null]} />;
            },
          },
        ]}
      />
      <Dialog name={'fdialog'} />

      <Modal
        title={`PO Items for ${currentPoNumber}`}
        open={poItemsModalVisible}
        onCancel={() => setPoItemsModalVisible(false)}
        width={1400}
        footer={[
          <Button key="cancel" onClick={() => setPoItemsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSavePoItems}
          >
            保存
          </Button>,
        ]}
      >
        {editablePoItems && editablePoItems.length > 0 ? (
          <AntTable
            dataSource={editablePoItems}
            columns={poItemColumns}
            rowKey={(record, index) => index}
            pagination={false}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>无数据</div>
        )}
      </Modal>
    </div>
  );
}
