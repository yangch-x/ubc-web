import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { history } from 'libs/util';
import customerService from 'services/Customer';
import styles from './index.module.less';

export default function Shipment() {
  const [searchParams, setSearchParams] = useState({
    pageNo: 1,
    pageSize: 10,
  });

  const [tableData, setTableData] = useState([]);
  const [selection, setSelection] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [loading, setLoading] = useState();
  const [pagination, setPagination] = useState({ total: 0 });
  const loadData = useCallback(() => {
    setLoading(true);
    customerService
      .search(searchParams)
      .then((res) => {
        setLoading(false);
        if (res.code !== 200) {
          message.error(`${res.msg}`); // 显示错误消息
          return;
        }
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
  const setReSearch = useCallback((row) => {
    setSearchParams({ ...row, pageNo: 1 });
  }, []);
  const searchEvent = (params) => {
    if (params.prop === 'search' && params.type === 'click') {
      setSearchParams(params.row);
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
          //   //此处id按实际字段名取
          //   customerService.deletes(selection.map((el) => el.id)).then((res) => {
          //     message.success('删除成功！');
          //     loadData();
          //   });
        },
      });
    }
  };
  const tableEvent = (params) => {
    if (params.prop === 'edit' && params.type === 'click') {
      Dialog.open('fdialog', '编辑').then((set) =>
        set(getDialogForm(params.row))
      );
    } else if (params.prop === 'pdel' && params.type === 'confirm') {
      const { customerID } = params.row;
      customerService
        .remove({ customerID })
        .then((res) => {
          if (res.code != 200) {
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
    }
  };

  const handleSort = (column) => {
    let order = 'ascend';
    if (column === sortField) {
      order = sortOrder === 'ascend' ? 'descend' : 'ascend';
    }
    setSortField(column);
    setSortOrder(order);

    const sortedData = [...tableData].sort((a, b) => {
      if (order === 'ascend') {
        if (a[column] < b[column]) return -1;
        if (a[column] > b[column]) return 1;
        return 0;
      }
      if (a[column] > b[column]) return -1;
      if (a[column] < b[column]) return 1;
      return 0;
    });

    setTableData(sortedData);
  };

  const getSortIcon = (column) => {
    if (sortField === column) {
      return sortOrder === 'ascend' ? (
        <SortAscendingOutlined />
      ) : (
        <SortDescendingOutlined />
      );
    }
    return <SortAscendingOutlined style={{ opacity: 0.2 }} />;
  };
  const getDialogForm = (formData) => {
    return (
      <Form
        config={{ labelCol: { span: 6 } }}
        onSubmit={(data) => {
          Dialog.loading('fdialog');
          customerService
            .saveOrUpdate(data)
            .then((res) => {
              if (res.code != 200) {
                message.error(`${res.msg}`); // 显示错误消息
                return;
              }

              message.success('操作成功！');
              loadData();
              Dialog.close('fdialog');
            })
            .catch((error) => {
              setLoading(false);
              Dialog.loading('fdialog', false);
              console.error(error);
            });
        }}
        data={formData}
        columns={[
          {
            type: 'input@w200',
            prop: 'customerCode',
            label: 'Customer Code',
          },
          {
            type: 'inputnumber@w200',
            prop: 'code',
            label: 'Code',
          },
          {
            type: 'input@w200',
            prop: 'country',
            label: 'Country',
          },
          {
            type: 'input@w200',
            prop: 'customerEmail',
            label: 'Customer Email',
          },
          {
            type: 'input@w200',
            prop: 'customerName',
            label: 'Customer Name',
          },
          {
            type: 'input@w200',
            prop: 'billingContact',
            label: 'Billing Contact',
          },
          {
            type: 'input@w200',
            prop: 'notifyContact',
            label: 'Notify Contact',
          },
          {
            type: 'input@w200',
            prop: 'paymentTerm',
            label: 'Payment Term',
          },
          {
            type: 'input@w200',
            prop: 'shipTo',
            label: 'Ship To',
          },
          {
            type: 'input@w200',
            prop: 'salesPerson',
            label: 'Sales Person',
          },
          {
            type: 'input@w200',
            prop: 'ubcMerchandiser',
            label: 'UBC Merchandiser',
          },
          {
            type: 'input@w200',
            prop: 'dischargeLoc',
            label: 'Discharge Loc',
          },
          {
            type: 'input@w200',
            prop: 'status',
            label: 'Status',
          },
          {
            type: 'inputnumber',
            prop: 'dueDateGap',
            label: 'DueDateGap',
          },
        ]}
      />
    );
  };
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
            placeholder: 'Customer Name',
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
              value: '添加',
              config: { icon: <PlusOutlined /> },
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
            prop: 'customerCode',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('customerCode')}
              >
                Customer Code {getSortIcon('customerCode')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'code',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('code')}
              >
                Code {getSortIcon('code')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'country',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('country')}
              >
                Country {getSortIcon('country')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'customerEmail',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('customerEmail')}
              >
                Customer Email {getSortIcon('customerEmail')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'customerName',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('customerName')}
              >
                Customer Name {getSortIcon('customerName')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'billingContact',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('billingContact')}
              >
                Billing Contact {getSortIcon('billingContact')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'notifyContact',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('notifyContact')}
              >
                Notify Contact {getSortIcon('notifyContact')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'paymentTerm',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('paymentTerm')}
              >
                Payment Term {getSortIcon('paymentTerm')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'shipTo',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('shipTo')}
              >
                Ship To {getSortIcon('shipTo')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'salesPerson',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('salesPerson')}
              >
                Sales Person {getSortIcon('salesPerson')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'ubcMerchandiser',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('ubcMerchandiser')}
              >
                UBC Merchandiser {getSortIcon('ubcMerchandiser')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'dischargeLoc',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('dischargeLoc')}
              >
                Discharge Loc {getSortIcon('dischargeLoc')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            type: 'text',
            prop: 'status',
            label: (
              <div
                className="sort-container"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </div>
            ),
            sorter: true,
            value: 'text',
          },
          {
            label: '操作',
            width: 200,
            render() {
              return [
                {
                  type: 'button-link',
                  prop: 'edit',
                  value: '编辑',
                  className: styles['edit'],
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
    </div>
  );
}
