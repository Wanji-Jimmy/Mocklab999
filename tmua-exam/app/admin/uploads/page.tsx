'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import {
  createUploadBatch,
  fetchAuthMe,
  fetchUploadBatches,
  previewUploadBatch,
  publishUploadBatch,
  rollbackUploadBatch,
  UploadBatchSummary,
  validateUploadBatch,
} from '@/lib/client-api'

const TMUA_SAMPLE = {
  examType: 'TMUA',
  name: 'TMUA 2023 P1 Demo',
  year: 2023,
  moduleKey: 'P1',
  questions: [
    {
      moduleOrPaper: 'P1',
      questionNumber: 1,
      stemLatex: 'If x+1=2, x=?',
      answerKey: 'A',
      explanationLatex: 'x=1',
      options: [
        { key: 'A', latex: '1' },
        { key: 'B', latex: '2' },
      ],
      tags: ['demo'],
    },
  ],
}

export default function AdminUploadsPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [batches, setBatches] = useState<UploadBatchSummary[]>([])
  const [uploadJson, setUploadJson] = useState(() => JSON.stringify(TMUA_SAMPLE, null, 2))
  const [info, setInfo] = useState<string | null>(null)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const user = await fetchAuthMe()
      setEmail(user?.email || null)
      if (!user?.isAdmin) {
        setIsAdmin(false)
        setBatches([])
        return
      }
      setIsAdmin(true)
      const rows = await fetchUploadBatches()
      setBatches(rows)
    } catch {
      setInfo('Failed to load admin uploads.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const withBatchAction = async (uploadId: string, action: () => Promise<void>, successText: string) => {
    setBusyId(uploadId)
    try {
      await action()
      setInfo(successText)
      await load()
    } catch {
      setInfo('Operation failed. Check role, payload, or network.')
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateBatch = async () => {
    setBusyId('create')
    setPreview(null)
    try {
      const parsed = JSON.parse(uploadJson) as Record<string, unknown>
      const uploadId = await createUploadBatch(parsed)
      setInfo(`Upload created: ${uploadId}`)
      await load()
    } catch {
      setInfo('Failed to create upload. Ensure JSON payload is valid.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop tone="warm" />
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <div className="flex gap-2">
            <Link href="/dashboard" className="warm-outline-btn px-4 py-2 rounded-lg text-sm">Dashboard</Link>
            <Link href="/account" className="warm-outline-btn px-4 py-2 rounded-lg text-sm">My Account</Link>
          </div>
        </div>

        <section className="warm-card rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Admin Console</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Question Upload Batches</h1>
          <p className="mt-2 text-slate-600">Upload, Validate, Preview, Publish, Rollback</p>
          <p className="mt-3 text-sm text-slate-600">Signed in: {email || 'Not signed in'}</p>
          {!isAdmin && !loading && (
            <p className="mt-2 text-sm text-red-700">Admin permission required. Non-admin users should receive 403.</p>
          )}
          {info && <p className="mt-2 text-sm text-amber-800">{info}</p>}
        </section>

        {isAdmin && (
          <>
            <section className="warm-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-900">Create Upload Batch</h2>
                <button
                  onClick={handleCreateBatch}
                  disabled={busyId === 'create'}
                  className="warm-primary-btn px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {busyId === 'create' ? 'Creating...' : 'Create Upload'}
                </button>
              </div>
              <textarea
                className="mt-4 w-full min-h-[280px] rounded-xl border border-slate-300 bg-white p-3 text-xs font-mono"
                value={uploadJson}
                onChange={(event) => setUploadJson(event.target.value)}
              />
            </section>

            <section className="warm-card rounded-2xl p-6">
              <h2 className="text-xl font-black text-slate-900">Recent Batches</h2>
              {batches.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No upload batches yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {batches.map((batch) => (
                    <div key={batch.id} className="rounded-xl border border-slate-200 bg-white/85 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{batch.id}</p>
                          <p className="text-xs text-slate-600">
                            {batch.examType} · {batch.status} · {new Date(batch.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              void withBatchAction(batch.id, () => validateUploadBatch(batch.id), 'Validated.')
                            }
                            disabled={busyId === batch.id}
                            className="warm-outline-btn px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                          >
                            Validate
                          </button>
                          <button
                            onClick={() =>
                              void withBatchAction(batch.id, async () => {
                                const payload = await previewUploadBatch(batch.id)
                                setPreview(payload)
                              }, 'Preview loaded.')
                            }
                            disabled={busyId === batch.id}
                            className="warm-outline-btn px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() =>
                              void withBatchAction(batch.id, () => publishUploadBatch(batch.id), 'Published.')
                            }
                            disabled={busyId === batch.id}
                            className="warm-primary-btn px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() =>
                              void withBatchAction(batch.id, () => rollbackUploadBatch(batch.id), 'Rolled back.')
                            }
                            disabled={busyId === batch.id}
                            className="warm-outline-btn px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                          >
                            Rollback
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {preview && (
              <section className="warm-card rounded-2xl p-6">
                <h2 className="text-xl font-black text-slate-900">Preview Payload</h2>
                <pre className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs overflow-auto">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
