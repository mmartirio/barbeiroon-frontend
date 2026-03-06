
import React, { useState } from "react";
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineCake } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import './login.css';


const Login = () => {
    const [userName, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = (event) => {
        event.preventDefault();
        navigate('/agendamento/calendarComponent');
    };

    const fields = [
        { label: t("login.name", "Seu nome"), type: "text", value: userName, setValue: setUsername, Icon: HiOutlineUser },
        { label: t("login.phone", "Seu telefone"), type: "tel", value: phone, setValue: setPhone, Icon: HiOutlineLockClosed },
        { label: t("login.birthday", "Seu aniversário"), type: "date", value: date, setValue: setDate, Icon: HiOutlineCake }
    ];

    return (
        <div className="login-bg-dark">
            <h1 className='title'>{t('login.welcome', 'Bem-vindo ao Meu barbeiro')}</h1>
            <div className="container-login">
                <form className="form" onSubmit={handleSubmit}>
                    <h1>{t('login.schedule', 'Agende seu horário')}</h1>
                    {fields.map(({ label, type, value, setValue, Icon }) => (
                        <div key={label} className={type === "date" ? "bday" : type === "tel" ? "phone" : "name"}>
                            <label>{label}</label>
                            <input type={type} placeholder={label} onChange={(e) => setValue(e.target.value)} value={value} />
                            <Icon className="icons" />
                        </div>
                    ))}
                    <div className="checkbox">
                        <input type="checkbox" />
                        <label>{t('login.remember', 'Lembrar de mim')}</label>
                        <button type="submit" className="btn-entrar">{t('login.enter', 'Entrar')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
