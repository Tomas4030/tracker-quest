"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { authService } from "@/services/authService";
import type { User } from "@/types";
import { getInitials } from "@/utils/helpers";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (user: User) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [name, setName] = useState(user.name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    return user.avatarUrl || null;
  }, [selectedFile, user.avatarUrl]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleSaveProfile = async () => {
    try {
      resetFeedback();
      setIsSavingProfile(true);

      let updatedUser = user;

      if (name.trim() !== user.name) {
        updatedUser = await authService.updateUser(user.id, {
          name: name.trim(),
        });
      }

      if (selectedFile) {
        updatedUser = await authService.updateAvatar(user.id, selectedFile);
      }

      onUserUpdated(updatedUser);
      setMessage("Perfil atualizado com sucesso.");
      setSelectedFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar perfil.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      resetFeedback();

      if (newPassword.length < 8) {
        throw new Error("A palavra-passe deve ter pelo menos 8 caracteres.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("As passwords não coincidem.");
      }

      setIsSavingPassword(true);
      await authService.updateMyPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password alterada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar a password.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      resetFeedback();
      setIsSendingReset(true);
      await authService.sendPasswordResetEmail(user.email);
      setMessage("Email de recuperação enviado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao enviar email de recuperação.",
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Definições da conta"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm"
          >
            Fechar
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm disabled:opacity-60"
          >
            {isSavingProfile ? "A guardar..." : "Guardar perfil"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Perfil</h4>

          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                {getInitials(user.name)}
              </div>
            )}

            <div className="flex-1">
              <label className="block text-xs mb-1 text-slate-500">
                Foto de perfil
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-slate-500">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-slate-500">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="space-y-3 border-t pt-5">
          <h4 className="text-sm font-semibold text-slate-900">Segurança</h4>

          <div>
            <label className="block text-xs mb-1 text-slate-500">
              Nova password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-slate-500">
              Confirmar nova password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleChangePassword}
              disabled={isSavingPassword}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
            >
              {isSavingPassword ? "A atualizar..." : "Alterar password"}
            </button>

            <button
              onClick={handleForgotPassword}
              disabled={isSendingReset}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-60"
            >
              {isSendingReset ? "A enviar..." : "Esqueci-me da password"}
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};
