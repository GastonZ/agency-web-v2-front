import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OfflineLayout from "../layout/OfflineLayout";
import SubLogin from "./SubLogin";

const SubAuth: React.FC = () => {
  const { t } = useTranslation("translations");

  return (
    <OfflineLayout>
      <SubLogin />
      <Link
        to="/auth"
        className="flex justify-center items-center w-full mt-4 p-2 bg-black dark:bg-gray-100 rounded-md cursor-pointer hover:scale-105 transition-transform"
      >
        <p className="text-center w-full text-sm text-gray-200 dark:text-black">
          {t("sub_login_back", { defaultValue: "¿Sos administrador? Ingresá con tu email" })}
        </p>
      </Link>
    </OfflineLayout>
  );
};

export default SubAuth;
