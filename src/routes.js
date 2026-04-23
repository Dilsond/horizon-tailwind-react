import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import NFTMarketplace from "views/admin/marketplace";
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";
import Transacao from "views/admin/transacao";
import PerfilUsuario from "views/admin/usuario/perfil.jsx";
import Relatorio from "views/admin/relatorio";
import Marketing from "views/admin/marketing";
import ModeracaoConteudo from "views/admin/moderacao";
import SuporteCliente from "views/admin/suporte";
import ConfiguracaoPlataforma from "views/admin/configuracao";
import Seguranca from "views/admin/seguranca";
import GerenciamentoUsuarios from "views/admin/usuario";
import GerenciamentoEmpresas from "views/admin/empresa";
import PerfilEmpresa from "views/admin/empresa/perfil.jsx";
import SignIn from "views/auth/SignIn";
// import GerenciamentoAdmins from "views/admin/admins";
// import UsuariosLogados from "views/admin/usuario/usuarios_logados";

// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdPerson,
  MdArchive,
  MdLock,
} from "react-icons/md";
import { FaHeadset, FaShieldAlt,  FaCog, FaUsers, FaBullhorn, FaExclamationTriangle, FaAccusoft, FaTable, FaKey, FaFingerprint } from 'react-icons/fa';
import DetalhesEvento from "views/admin/detalhes";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "default",
    admin: true,
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  {
    name: "Eventos Divulgados",
    layout: "/admin",
    path: "nft-marketplace",
    admin: true,
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
    component: <NFTMarketplace />,
    secondary: true,
  },
  {
    name: "Detalhes Evento",
    layout: "/admin",
    admin: false,
    path: "detalhes/:id",
    icon: <FaBullhorn className="inline-block h-6 w-6" />,
    component: <DetalhesEvento />,
  },
  {
    name: "Gerenciar Usuários",
    layout: "/admin",
    path: "usuario",
    admin: true,
    icon: <FaUsers className="h-6 w-6" />,
    component: <GerenciamentoUsuarios />,
  },
  {
    name: "Gerenciar Organizadores",
    layout: "/admin",
    path: "gerenciaremp",
    admin: true,
    icon: <FaAccusoft className="h-6 w-6" />,
    component: <GerenciamentoEmpresas />,
  },
  {
    name: "Tabelas",
    layout: "/admin",
    admin: false,
    icon: <FaTable className="inline-block h-5 w-5" />,
    path: "data-tables",
    component: <DataTables />,
  },
  {
    name: "Relatórios",
    layout: "/admin",
    path: "relatorio",
    admin: false,
    icon: <MdArchive className="h-6 w-6" />,
    component: <Relatorio />,
  }, 
  {
    name: "Promoções e Marketing",
    layout: "/admin",
    path: "marketing",
    admin: true,
    icon: <FaBullhorn className="inline-block h-6 w-6" />,
    component: <Marketing />,
  },
  {
    name: "Transação e Pagamentos",
    layout: "/admin",
    path: "transacao",
    admin: false,
    icon: <MdArchive className="h-6 w-6" />,
    component: <Transacao />,
  },
  {
    name: "Moderação de Conteúdo",
    layout: "/admin",
    path: "moderacao",
    admin: true,
    icon: <FaExclamationTriangle className="inline-block h-6 w-6" />,
    component: <ModeracaoConteudo />,
  },
  {
    name: "Suporte ao Cliente",
    layout: "/admin",
    path: "suporte",
    admin: true,
    icon: <FaHeadset className="inline-block h-6 w-6" />,
    component: <SuporteCliente />,
  },
  {
    name: "Configurações Gerais",
    layout: "/admin",
    path: "configuracoes",
    admin: false,
    icon: <FaCog className="h-6 w-6" />,
    component: <ConfiguracaoPlataforma />,
  },
  {
    name: "Segurança",
    layout: "/admin",
    path: "seguranca",
    admin: false,
    icon: <FaShieldAlt className="h-6 w-6" />,
    component: <Seguranca />,
  },
  {
    name: "Perfil",
    layout: "/admin",
    path: "profile",
    admin: true,
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Perfil Usuário",
    layout: "/admin",
    path: "perfiluser/:id",
    admin: false,
    icon: <MdPerson className="h-6 w-6" />,
    component: <PerfilUsuario />,
  },
  {
    name: "Perfil Organizador",
    layout: "/admin",
    path: "perfilempresa/:id",
    admin: false,
    icon: <MdPerson className="h-6 w-6" />,
    component: <PerfilEmpresa />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    admin: false,
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  // {
  //   name: "Users Logados",
  //   layout: "/admin",
  //   admin: true,
  //   path: "users-logados",
  //   icon: <FaFingerprint className="h-6 w-6" />,
  //   component: <UsuariosLogados />,
  // },
  // {
  //   name: "Admins",
  //   layout: "/admin",
  //   icon: <FaKey className="inline-block h-5 w-5" />,
  //   path: "admins",
  //   admin: true,
  //   component: <GerenciamentoAdmins />,
  // },
  
];
export default routes;
