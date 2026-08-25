'use client';

import {
  FormEvent,
  useState
} from 'react';

import {
  sendNexusCommand
} from '@/lib/api';

interface NexusCommandProps {
  onCompleted: () => void;
}

const QUICK_COMMANDS = [
  'Tạo công việc mới',
  'Tạo sự kiện trên lịch',
  'Ghi chi tiêu',
  'Tổng quan hôm nay'
];

/* ==========================================
   NEXUS COMMAND COMPONENT
========================================== */

export default function NexusCommand({
  onCompleted
}: NexusCommandProps) {

  const [message, setMessage] =
    useState('');

  const [response, setResponse] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [awaitingConfirmation, setAwaitingConfirmation] =
    useState(false);

  /* ======================================
     SEND COMMAND
  ====================================== */

  const submitCommand = async (
    commandMessage: string
  ) => {
    const cleanMessage = commandMessage.trim();

    if (!cleanMessage || loading) {
      return;
    }

    try {
      setLoading(true);

      setResponse('');

      const result =
        await sendNexusCommand(
          cleanMessage
        );

      const reply =
        result.result?.message ||
        result.message ||
        'NEXUS đã xử lý yêu cầu.';

      setResponse(
        reply
      );

      setAwaitingConfirmation(
        Boolean(result.requiresConfirmation)
      );

      setMessage('');

      await onCompleted();

    } catch (error) {

      console.error(
        '❌ NEXUS command error:',
        error
      );

      setResponse(
        error instanceof Error
          ? `Không thể xử lý yêu cầu: ${error.message}`
          : 'Không thể kết nối với NEXUS.'
      );

    } finally {

      setLoading(false);

    }
  };

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();
    void submitCommand(message);
  };

  /* ======================================
     UI
  ====================================== */

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-zinc-950/80 p-4 backdrop-blur-xl sm:p-5">

      <div className="mb-3 flex items-end justify-between gap-4">

        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-emerald-400/70">THAO TÁC NHANH</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Bạn muốn NEXUS làm gì?</h2>
        </div>
        <span className="hidden text-xs text-zinc-600 sm:block">Enter để gửi</span>

      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="flex flex-col gap-3 sm:flex-row"
      >

        <input
          aria-label="Nhập yêu cầu cho NEXUS"
          value={
            message
          }

          onChange={
            event =>
              setMessage(
                event.target.value
              )
          }

          placeholder="Nhập yêu cầu: tạo task, ghi tiền, đặt lịch..."

          disabled={
            loading
          }

          className="
            flex-1
            rounded-xl
            border
            border-white/10
            bg-black/40
            px-4
            py-3.5
            text-white
            outline-none
            transition
            placeholder:text-zinc-600
            focus:border-emerald-400/50
            focus:ring-4
            focus:ring-emerald-400/5
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        />

        <button
          type="submit"

          disabled={
            loading ||
            !message.trim()
          }

          className="
            rounded-xl
            bg-emerald-300
            px-7
            py-3.5
            font-medium
            text-emerald-950
            transition
            hover:bg-emerald-200
            hover:shadow-lg
            hover:shadow-emerald-950/40
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {
            loading
              ? 'Đang xử lý...'
              : 'Gửi'
          }
        </button>

      </form>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUICK_COMMANDS.map(command => (
          <button
            key={command}
            type="button"
            disabled={loading}
            onClick={() => setMessage(command)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-400 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-50"
          >
            {command}
          </button>
        ))}
      </div>

      {awaitingConfirmation && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-900/70 bg-amber-950/30 p-3">
          <span className="mr-auto text-sm text-amber-200">
            Yêu cầu đang chờ quyết định của bạn.
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submitCommand('hủy')}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submitCommand('xác nhận')}
            className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-200 disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      )}

      {/* ==================================
          AI RESPONSE
      ================================== */}

      {response && (

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">

          <div className="flex gap-3">

            <div className="shrink-0 text-lg">
              🤖
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
              {response}
            </p>

          </div>

        </div>

      )}

    </section>
  );
}
