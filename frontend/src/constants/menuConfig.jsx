import {
     DashboardOutlined,
     UserOutlined,
     AudioOutlined,
     TransactionOutlined,
     BlockOutlined,
     PieChartOutlined
} from "@ant-design/icons";

const MenuConfig = () => {
     const menuItems = [
          {
               key: "0",
               label: "Tổng quan",
               icon: <DashboardOutlined />,
               path: "/dashboard",

          },
          {
               key: "1",
               label: "Tài khoản",
               icon: <UserOutlined />,
               path: "/dashboard/accounts",
          },
          {
               key: "2",
               label: "Giao dịch",
               icon: <TransactionOutlined />,
               path: "/dashboard/transactions",
          },
          {
               key: "3",
               label: "Nghệ sĩ",
               icon: <AudioOutlined />,
               path: "/dashboard/transactions",
          },
          {
               key: "4",
               label: "Album",
               icon: <BlockOutlined />,
               path: "/dashboard/transactions",
          },
          {
               key: "5",
               label: "Thống kê",
               icon: <PieChartOutlined />,
               children: [
                    {
                         key: "4.1",
                         label: "Theo loại giao dịch",
                         path: "/dashboard/statistics/by-transaction-type",
                    },
                    {
                         key: "4.2",
                         label: "Theo tài khoản",
                         path: "/dashboard/statistics/by-account",
                    }
               ]
          }
     ];
     return menuItems;
}

export default MenuConfig;