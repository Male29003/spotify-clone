import React, { useState} from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import "./LoginRegis.css";

function LoginToggle(){
    const [isSingup, setIsSingup] = useState(false);
    const [error, setError] = useState(-1);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [regisPass, setRegisPass] = useState("");
    const [regisPassConfirm, setRegisPassConfirm] = useState("");

    const navigate = useNavigate();

    const validatePassword = () => {
        if(regisPass.length < 6){
            setError(1);
            return false;
        }
        setError(-1);
        return true;
    }

    const validateConfirmPassword = () => {
        if(regisPass !== regisPassConfirm){
            setError(2);
            return false;
        }
        else if(regisPass.length < 6){
            setError(1);
            return false;
        }
        setError(-1);
        return true;
    }

    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(3);
            return false;
        }
        setError(-1);
        return true;
    }

    return (
        <div
        className={`login-wrapper relative min-w-[768px] max-w-full min-h-[480px] bg-white rounded-3xl shadow-xl overflow-hidden ${
            isSingup ? "active" : ""
        }`}
    >
        {/* Sign-Up Form */}
      <div
        className={`form-wrapper absolute top-0 h-full w-1/2 transition-all duration-300 ${
          isSingup ? "translate-x-full opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <form
          id="regisForm"
          onSubmit={(e) => {
            e.preventDefault();
            register(e);
          }}
          className="flex flex-col items-center px-10 h-full"
        >
          <input
            type="email"
            placeholder="Email"
            name="username"
            className="input-field"
            value={email}
            onChange={(e) => setemail(e.target.value)}
            onBlur={validateEmail}
            required
          />
          {error === 3 && (
            <p className="text-red-500 text-sm mt-2">* Sai định dạng email !</p>
          )}
          <input
            type="password"
            placeholder="Mật khẩu"
            name="password"
            className="input-field"
            value={regisPass}
            onChange={(e) => setRegisPass(e.target.value)}
            onBlur={validatePassword}
            required
          />
          {error === 1 && (
            <p className="text-red-500 text-sm mt-2">
              * Mật khẩu phải có ít nhất 6 ký tự !
            </p>
          )}
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="input-field"
            value={regisPassConfirm}
            onChange={(e) => setRegisCPass(e.target.value)}
            onBlur={validateConfirmPassword}
            required
          />
          {error === 2 && (
            <p className="text-red-500 text-sm mt-2">
              * Tài khoản nhập lại không chính xác !
            </p>
          )}
          <button
            type="submit"
            disabled={registerMutation.isPending }
            className=" bg-slate-500 hover:bg-slate-600 text-white uppercase text-sm py-2 px-6 rounded-md cursor-pointer mt-4 "
          >
            {registerMutation.isPending && <Spin size="small" style={{marginRight:8}}/>}
            Đăng Kí
          </button>
        </form>
      </div>

      {/* Sign-In Form */}
      <div
        className={`form-wrapper absolute top-0 h-full w-1/2 transition-all duration-300 ${
          isSingup ? "-translate-x-full opacity-0 z-0" : "opacity-100 z-10"
        }`}
      >
        <form
          id="loginForm"
          onSubmit={(e) => {
            e.preventDefault();
            login(e);
          }}
          className="flex flex-col items-center px-10 h-full"
        >
          <h1 className="text-2xl font-bold mb-4 pt-5">Đăng Nhập</h1>
          <input
            type="text"
            placeholder="Email"
            name="username"
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            name="password"
            className="input-field"
            required
          />
          {/* <a href="/forgot-password" className="text-sm text-gray-500 mt-2">
            Quên mật khẩu?
          </a> */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className=" bg-slate-500 hover:bg-slate-600 text-white uppercase text-sm py-2 px-6 rounded-md cursor-pointer mt-4 "
          >
            {loginMutation.isPending && <Spin size="small" style={{marginRight:8}}/>}
            Đăng Nhập
          </button>
        </form>
      </div>

      {/* Toggle Container */}
      <div
        className={`toggle-container absolute top-0 right-0 w-1/2 h-full transition-all duration-300 ${
          isSingup ? "translate-x-[-100%]" : "translate-x-0"
        }`}
      >
        <div className="toggle bg-gradient-to-r from-slate-600 to-blue-200 h-full flex flex-col items-center justify-center text-center">
          {isSingup ? (
            <>
              <h1 className="text-3xl font-bold text-white">
                Chào mừng trở lại!
              </h1>
              <p className="text-white text-sm mt-2">Đăng nhập để tiếp tục</p>
              <button
                className="bg-slate-500 hover:bg-slate-600 uppercase text-sm py-2 px-6 rounded-md cursor-pointer mt-4 text-white hover:bg-transparent-medium"
                onClick={() => {
                  setIsSingup(false);
                  const form = document.getElementById("regisForm");
                  if (form) {
                    form.reset();
                  }
                  setError(-1);
                }}
              >
                Đăng nhập
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white">Xin chào!</h1>
              <p className="text-white text-sm mt-2">
                Đăng kí để trải nghiệm tính năng
              </p>
              <button
                className="bg-slate-500 hover:bg-slate-600 uppercase text-sm py-2 px-6 rounded-md cursor-pointer mt-4 text-white "
                onClick={() => {
                  setisSingup(true);
                  const form = document.getElementById("loginForm");
                  if (form) {
                    form.reset();
                  }
                }}
              >
                Đăng kí
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    )
}

export default LoginToggle;