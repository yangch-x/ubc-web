import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SaveOutlined,
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

    // 创建要保存的数据对象，包含所有原始数据和更新后的poItems
    // 将poItems转换为JSON字符串
    const updatedData = {
      ...currentRowData,
      poItems: JSON.stringify(editablePoItems),
    };

    // 调用保存接口
    projectionService
      .saveOrUpdate(updatedData)
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
      Dialog.open('fdialog', '编辑').then((set) =>
        set(getDialogForm(params.row))
      );
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
      const { projID } = params.row;

      projectionService
        .remove({ projID })
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
          onChange={(value) => handleCellChange(value, record, 'qTY', index)}
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
          },
          {
            type: 'text',
            prop: 'customerCode',
            label: 'CUSTOMER',
          },
          {
            type: 'button-link',
            prop: 'customerPo',
            label: 'CUSTOMER P.O.',
            value: ({ customerPo }) => customerPo || '',
          },
          {
            type: 'text',
            prop: 'styleCode',
            label: 'STYLE NO',
          },
          {
            type: 'text',
            prop: 'styleName',
            label: 'DESC/STYLE NAME',
          },
          {
            type: 'text',
            prop: 'color',
            label: 'COLOR',
          },
          {
            type: 'text',
            prop: 'fabrication',
            label: 'FABRICATION',
          },
          {
            type: 'text',
            prop: 'poQty',
            label: 'QTY/PC',
          },
          {
            type: 'text',
            prop: 'costPrice',
            label: '￥ BUY',
          },
          {
            type: 'text',
            prop: 'ttlBuy',
            label: 'TTL BUY',
          },
          {
            type: 'text',
            prop: 'salePrice',
            label: '$ SELL',
          },
          {
            type: 'text',
            prop: 'ttlSell',
            label: 'TTL SELL',
          },
          {
            type: 'text',
            prop: 'exporter',
            label: 'VENDOR',
          },
          {
            type: 'text',
            prop: 'waterResistant',
            label: 'WATER RESISTANT / Y/N',
          },
          {
            type: 'text',
            prop: 'notes',
            label: 'NOTE',
          },
          {
            type: 'text',
            prop: 'country',
            label: 'Country&Brand ID',
          },

          {
            label: '操作',
            width: 260,
            render() {
              return [
                {
                  type: 'button-link',
                  prop: 'edit',
                  value: '编辑',
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
