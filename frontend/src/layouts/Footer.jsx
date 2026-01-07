import { Footer } from "antd/es/layout/layout"

const CustomFooter = () => {
    return (
        <Footer
            className="text-center font-bad-script"
        >
            Copyright @ {new Date().getFullYear()} Phát triển bởi <span className="font-bold">NKN</span>
        </Footer>
    );
};

export default CustomFooter;