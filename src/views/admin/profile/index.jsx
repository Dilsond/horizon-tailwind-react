import { MdModeEditOutline, MdSave, MdClose, MdPhotoCamera, MdLock } from "react-icons/md";
import Card from "components/card";
import avatar from "assets/img/avatars/avatar11.png";
import banner from "assets/img/profile/banner.png";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.ts";
import PasswordChangeModal from "./PasswordChangeModal";

const ProfileOverview = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const adminFromStorage = localStorage.getItem('admin');
      if (!adminFromStorage) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const admin = JSON.parse(adminFromStorage);

      const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('id', admin.id)
        .single();

      if (error) throw error;

      setAdminData(data);
    } catch (err) {
      console.error('Erro ao buscar dados do admin:', err);
      setError('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field, currentValue) => {
    setEditing({ ...editing, [field]: true });
    setEditForm({ ...editForm, [field]: currentValue });
    setError(null);
    setSuccess(null);
  };

  const cancelEditing = (field) => {
    const newEditing = { ...editing };
    delete newEditing[field];
    setEditing(newEditing);

    const newForm = { ...editForm };
    delete newForm[field];
    setEditForm(newForm);
  };

  const handleInputChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const saveField = async (field) => {
    try {
      const adminFromStorage = localStorage.getItem('admin');
      const admin = JSON.parse(adminFromStorage);

      const updateData = {};
      updateData[field] = editForm[field];

      const { error: updateError } = await supabase
        .from('administradores')
        .update(updateData)
        .eq('id', admin.id);

      if (updateError) throw updateError;

      // Atualizar dados locais
      setAdminData({ ...adminData, ...updateData });

      // Atualizar localStorage
      const updatedAdmin = { ...admin, ...updateData };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));

      // Sair do modo de edição
      const newEditing = { ...editing };
      delete newEditing[field];
      setEditing(newEditing);

      setSuccess('Campo atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError('Erro ao atualizar campo');
    }
  };

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida');
        return;
      }

      // if (file.size > 2 * 1024 * 1024) {
      //   setError('A imagem deve ter no máximo 2MB');
      //   return;
      // }

      setUploadingAvatar(true);
      setError(null);

      const adminFromStorage = localStorage.getItem('admin');
      const admin = JSON.parse(adminFromStorage);

      const fileExt = file.name.split('.').pop();
      const fileName = `${admin.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('admin-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('administradores')
        .update({ avatar_url: publicUrl })
        .eq('id', admin.id);

      if (updateError) throw updateError;

      setAdminData({ ...adminData, avatar_url: publicUrl });

      const updatedAdmin = { ...admin, avatar_url: publicUrl };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));

      setSuccess('Foto atualizada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setError('Erro ao atualizar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccess('Senha alterada com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-5">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error && !adminData) {
    return (
      <div className="flex w-full flex-col gap-5">
        <div className="text-center text-red-500 p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Mensagens de feedback */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="w-ful mt-3 flex h-fit flex-col gap-5 lg:grid lg:grid-cols-1">
        <div className="col-span-6 lg:!mb-0">
          <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
            {/* Background and profile */}
            <div
              className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
              style={{ backgroundImage: `url(${banner})` }}
            >
              <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-pink-400 dark:!border-navy-700 group">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={adminData?.avatar_url || avatar}
                  alt={adminData?.nome || "Avatar"}
                />

                {/* Botão de editar foto */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <MdPhotoCamera className="text-white text-2xl" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />

                {/* Loading indicator */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Name and position */}
            <div className="mt-16 flex flex-col items-center">
              <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                {adminData?.nome || "Administrador"}
              </h4>
              <p className="text-base font-normal text-gray-600">{adminData?.email}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid h-full grid-cols-1 gap-5 lg:!grid-cols-1">
        <div className="col-span-5 lg:col-span-6 lg:mb-0 3xl:col-span-5">
          <Card extra={"w-full h-full p-3"}>
            {/* Header */}
            <div className="mt-2 mb-8 w-full flex justify-between items-center">
              <div>
                <h4 className="px-2 text-xl font-bold text-navy-700 dark:text-white">
                  Informações Gerais
                </h4>
                <p className="mt-2 px-2 text-base text-gray-600">
                  Gerencie suas informações pessoais
                </p>
              </div>

              {/* Botão de alterar senha */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <MdLock className="w-5 h-5" />
                Alterar Senha
              </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-4 px-2">
              {/* Nome */}
              <div className="relative flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                {editing.nome ? (
                  <>
                    <input
                      type="text"
                      value={editForm.nome || ''}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-base"
                      placeholder="Seu nome"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveField('nome')}
                        className="text-green-600 hover:text-green-700"
                        title="Salvar"
                      >
                        <MdSave size={20} />
                      </button>
                      <button
                        onClick={() => cancelEditing('nome')}
                        className="text-red-600 hover:text-red-700"
                        title="Cancelar"
                      >
                        <MdClose size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      title="Editar"
                      onClick={() => startEditing('nome', adminData?.nome)}
                    >
                      <MdModeEditOutline />
                    </button>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="text-base font-medium text-navy-700 dark:text-white">
                      {adminData?.nome || "Não informado"}
                    </p>
                  </>
                )}
              </div>

              {/* Email */}
              <div className="relative flex flex-col justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-navy-700 dark:text-white">
                  {adminData?.email || "Não informado"}
                </p>
              </div>

              {/* Cargo */}
              <div className="relative flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                <p className="text-sm text-gray-600">Cargo</p>
                <p className="text-base font-medium text-navy-700 dark:text-white">
                  {adminData?.cargo || "Administrador"}
                </p>
              </div>

              <div className="relative flex flex-col justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                <p className="text-sm text-gray-600">Membro desde</p>
                <p className="text-base font-medium text-navy-700 dark:text-white">
                  {adminData.created_at
                    ? new Date(adminData.created_at).toLocaleDateString('pt-PT')
                    : 'Não informado'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={adminData?.id}
          userEmail={adminData?.email}
          userName={adminData?.nome}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </div>
  );
};

export default ProfileOverview;