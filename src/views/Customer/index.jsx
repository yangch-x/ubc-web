import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Search, Region, Table, Dialog, Form } from 'freedomen';
import { message, Modal } from 'antd';
import customerService from 'services/Customer';
import styles from './index.module.less';

// export default function Customer() {
//   const regionEvent = (params) => {
//     if (params.prop === 'add' && params.type === 'click') {
//       Dialog.open('fdialog', 'Projection').then((set) => set(getDialogForm()));
//     } else if (params.prop === 'dels' && params.type === 'click') {
//       Modal.confirm({
//         content: '确定要删除选中的' + selection.length + '条数据？',
//         onOk() {
//           //此处id按实际字段名取
//           customerService.deletes(selection.map((el) => el.id)).then((res) => {
//             message.success('删除成功！');
//             loadData();
//           });
//         },
//       });
//     }
//   };
//   const getDialogForm = (formData) => {
//     return (
//       <Form
//         onSubmit={(data) => {
//           Dialog.loading('fdialog');
//           customerService
//             .update(data)
//             .then((res) => {
//               //也可以根据是否有 id 不同提示
//               message.success('操作成功！');
//               loadData();
//               Dialog.close('fdialog');
//             })
//             .catch((e) => {
//               Dialog.loading('fdialog', false);
//             });
//         }}
//         data={formData}
//         columns={[
//           {
//             type: 'treeselect@w200',
//             prop: 'customerCode',
//             label: 'Customer Code',
//             disabled: ({ value, data }) => {},
//           },
//           {
//             type: 'input@w200',
//             prop: 'houseBlNum',
//             label: 'Bill of Landing',
//             config: { allowClear: true },
//           },
//           {
//             type: 'input@w200',
//             prop: 'masterPo',
//             label: 'Master PO',
//             config: { allowClear: false },
//           },
//           { type: 'input@w200', prop: 'rmbInv', label: 'RMB Invoice' },
//           { type: 'input@w200', label: '装运日期' },
//           { type: 'input@w200', prop: 'shipFrom', label: 'Ship From' },
//           { type: 'input@w200', prop: 'shipMethod', label: 'Ship Method' },
//           {
//             type: 'input@w200',
//             prop: 'origCountry',
//             label: 'Country of Origin',
//           },
//           { type: 'input@w200', prop: 'ubcPi', label: 'UBC PI' },
//           { type: 'input@w200', prop: 'shipTerm', label: 'Term' },
//           { type: 'input@w200', prop: 'masterBlNum', label: 'Master Bl Num' },
//           { type: 'input@w200', prop: 'exporter', label: 'Exporter' },
//           { type: 'input@w200', prop: 'shipName', label: 'Ship Name' },
//           { type: 'input@w200', prop: 'shipDt', label: 'Ship Dt' },
//           { type: 'input@w200', prop: 'arriveDt', label: 'ETD Dt' },
//           { type: 'input@w200', prop: 'invoiceTtl', label: 'Invoice Ttl' },
//           { type: 'input@w200', prop: 'notes', label: 'Notes' },
//         ]}
//       />
//     );
//   };
//   return (
//     <div className={'freedomen-page'}>
//       <Search
//         className={'f-search'}
//         columns={[
//           { type: 'input', prop: 'houseBlNum', label: 'Customer Name' },
//           { type: 'input', prop: 'shipFrom', label: 'Sales Person' },
//           {
//             type: 'button-primary',
//             prop: 'search',
//             value: 'search',
//             config: { icon: <SearchOutlined /> },
//           },
//         ]}
//       />
//       <Region
//         onEvent={regionEvent}
//         columns={[
//           [
//             {
//               type: 'button-primary',
//               prop: 'add',
//               value: '添加',
//               load: ({ value, data }) => {
//                 return true;
//               },
//               config: { icon: <PlusOutlined />, ghost: false },
//             },
//             { type: 'upload' },
//             {
//               type: 'button',
//               prop: 'dels',
//               value: '删除选中',
//               load: ({ value, data }) => {
//                 return selection.length;
//               },
//               config: { danger: true, icon: <DeleteOutlined /> },
//             },
//             { type: 'space' },
//           ],
//         ]}
//       />
//       <Table
//         pagination={false}
//         config={{ bordered: false, selection: false }}
//         columns={[
//           { type: 'text', label: 'Customer Code', value: 'text' },
//           { type: 'text', label: 'Country', value: 'text' },
//           { type: 'text', label: 'Customer Email', value: 'text' },
//           { type: 'text', label: 'Customer Name', value: 'text' },
//           { type: 'text', label: 'Billing Contact', value: 'text' },
//           { type: 'text', label: 'Notify Contact', value: 'text' },
//           { type: 'text', label: 'Payment Term', value: 'text' },
//           { type: 'text', label: 'Ship To', value: 'text' },
//           { type: 'text', label: 'Sales Person', value: 'text' },
//           { type: 'text', label: 'UBC Merchandiser', value: 'text' },
//           { type: 'text', label: 'Discharge Loc', value: 'text' },
//           { type: 'text', label: 'TTL SELL', value: 'text' },
//           { type: 'text', label: 'Status', value: 'text' },
//           {
//             render() {
//               return [
//                 { type: 'progress' },
//                 { type: 'button', value: '编辑' },
//                 { type: 'space' },
//               ];
//             },
//           },
//         ]}
//       />
//       <Dialog name={'fdialog'} />
//     </div>
//   );
// }
