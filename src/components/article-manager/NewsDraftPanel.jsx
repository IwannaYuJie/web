import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { collectNewsDrafts, dismissNewsDraft, fetchNewsDrafts, publishNewsDraft, updateNewsDraft } from '../../services/newsDrafts'
import './NewsDraftPanel.css'

const MarkdownRenderer = lazy(() => import('../MarkdownRenderer'))

class DraftPreviewBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="news-preview-error" role="alert">
          <p>预览暂时无法加载，草稿内容仍可编辑和保存。</p>
          <p className="news-muted">保存后刷新页面，即可重新尝试预览。</p>
          <button type="button" className="btn ghost" onClick={this.props.onEdit}>继续编辑正文</button>
        </div>
      )
    }
    return this.props.children
  }
}

function formatDate(value) {
  if (!value) {
    return '未提供'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '未提供' : new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

function createForm(draft) {
  return {
    title: draft.title || '',
    description: draft.description || '',
    content: draft.content || '',
    tags: (draft.tags || []).join('，'),
  }
}

function SourceLink({ draft }) {
  return <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer">{draft.sourceName} · 查看原文 ↗</a>
}

function NewsDraftEditor({ draft, busy, onClose, onSave, onPublish, onDirtyChange }) {
  const [form, setForm] = useState(() => createForm(draft))
  const [preview, setPreview] = useState(true)
  const formRef = useRef(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(createForm(draft))
  const published = draft.status === 'published'

  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!dirty) {
      return undefined
    }
    const warnBeforeLeaving = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [dirty])

  const submit = async (publish = false) => {
    if (!formRef.current.reportValidity()) {
      return
    }
    const payload = {
      ...form,
      tags: [...new Set(form.tags.split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean))],
    }
    if (publish) {
      if (!window.confirm(`确认将《${form.title}》发布为公开文章？\n当前编辑内容会先保存，发布后访客即可看到。`)) {
        return
      }
      await onPublish(draft.id, payload)
    } else {
      const saved = await onSave(draft.id, payload)
      if (saved) {
        setForm(createForm(saved))
      }
    }
  }

  return (
    <section className="panel news-editor" aria-labelledby="news-editor-title">
      <div className="news-heading-row">
        <div>
          <h2 id="news-editor-title">{published ? '已发布的资讯' : '审阅资讯草稿'}</h2>
          <p className="news-muted">{published ? '此处保留发布时的草稿，后续修改请进入文章管理。' : '先对照原文检查内容，满意后再发布。'} <SourceLink draft={draft} /></p>
        </div>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => {
          if (!dirty || window.confirm('还有未保存的修改，确认关闭？')) {
            onClose()
          }
        }}>收起</button>
      </div>
      <form ref={formRef} onSubmit={(event) => { event.preventDefault(); submit() }}>
        <fieldset disabled={busy || published} className="news-fields">
          <label htmlFor="news-title">标题
            <input type="text" id="news-title" name="title" value={form.title} maxLength={200} required onChange={event => setForm({ ...form, title: event.target.value })} />
          </label>
          <label htmlFor="news-description">摘要
            <textarea id="news-description" name="description" value={form.description} rows={3} maxLength={1000} required onChange={event => setForm({ ...form, description: event.target.value })} />
          </label>
          <label htmlFor="news-tags">标签 <span className="news-muted">用逗号分隔</span>
            <input type="text" id="news-tags" name="tags" value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} />
          </label>
        </fieldset>
        <div className="news-heading-row news-content-label">
          <label htmlFor="news-content">正文 <span className="news-muted">支持 Markdown</span></label>
          <button type="button" className="news-text-button" aria-pressed={preview} onClick={() => setPreview(!preview)}>
            {preview ? '编辑正文' : '查看预览'}
          </button>
        </div>
        <textarea id="news-content" name="content" value={form.content} rows={16} maxLength={50000} required disabled={busy || published} className={`news-content-input${preview ? ' news-sr-only' : ''}`} onChange={event => setForm({ ...form, content: event.target.value })} onInvalid={() => setPreview(false)} />
        {preview && (
          <div className="news-markdown-preview">
            <DraftPreviewBoundary onEdit={() => setPreview(false)}>
              <Suspense fallback={<p className="news-muted">预览加载中…</p>}><MarkdownRenderer content={form.content} /></Suspense>
            </DraftPreviewBoundary>
          </div>
        )}
        <div className="news-editor-footer">
          <p className="news-muted">{published ? '已发布' : dirty ? '有未保存的修改' : '草稿已保存，仅管理员可见'}</p>
          {published ? <Link className="btn" to={`/article/${draft.publishedArticleId}`}>查看已发布文章 ↗</Link> : (
            <div className="news-actions">
              <button type="submit" className="btn ghost" disabled={busy}>{busy ? '处理中…' : '保存草稿'}</button>
              <button type="button" className="btn" disabled={busy} onClick={() => submit(true)}>发布为文章 →</button>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}

function NewsDraftPanel({ adminKey, onUnauthorized, onPublished, onDirtyChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('draft')
  const [pollPaused, setPollPaused] = useState(false)
  const [awaitingStart, setAwaitingStart] = useState(false)
  const pendingCollection = useRef(null)
  const fetching = useRef(false)
  const requestSequence = useRef(0)
  const mounted = useRef(true)
  const editorAnchor = useRef(null)
  const collector = data?.collector || {}
  const running = collector.status === 'running' || awaitingStart
  const drafts = (data?.drafts || []).filter(draft => draft.status === filter)
  const pendingCount = (data?.drafts || []).filter(draft => draft.status === 'draft').length
  const publishedCount = (data?.drafts || []).filter(draft => draft.status === 'published').length

  const showError = useCallback((err) => {
    if (err.status === 401) {
      onUnauthorized()
      return
    }
    setError(err.message || '操作失败，请稍后重试')
  }, [onUnauthorized])

  const refresh = useCallback(async (signal) => {
    if (fetching.current) {
      return
    }
    const requestId = ++requestSequence.current
    fetching.current = true
    setLoading(true)
    try {
      const result = await fetchNewsDrafts(adminKey, signal)
      if (mounted.current && !signal?.aborted && requestId === requestSequence.current) {
        setData(result)
        setError('')
        setPollPaused(false)
        const pending = pendingCollection.current
        if (pending) {
          const started = result.collector?.status === 'running' || result.collector?.lastStartedAt !== pending.previousStartedAt
          if (started || Date.now() >= pending.expiresAt) {
            pendingCollection.current = null
            setAwaitingStart(false)
            if (!started) {
              setNotice('采集任务已提交，还在等待启动。稍后点「刷新」查看进度。')
            }
          }
        }
      }
    } catch (err) {
      if (mounted.current && err.name !== 'AbortError' && requestId === requestSequence.current) {
        showError(err)
        setPollPaused(true)
      }
    } finally {
      if (requestId === requestSequence.current) {
        fetching.current = false
        if (mounted.current) {
          setLoading(false)
        }
      }
    }
  }, [adminKey, showError])

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    refresh(controller.signal)
    return () => {
      mounted.current = false
      requestSequence.current += 1
      controller.abort()
      fetching.current = false
    }
  }, [refresh])

  // Only refresh an active collection. Failed or long-running checks can be resumed manually.
  useEffect(() => {
    if (!running || pollPaused) {
      return undefined
    }
    let checks = 0
    const timer = window.setInterval(() => {
      if (checks >= 36) {
        setPollPaused(true)
        return
      }
      checks += 1
      refresh()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [running, pollPaused, refresh])

  const collect = async () => {
    setBusy('collect')
    setError('')
    setNotice('')
    try {
      await collectNewsDrafts(adminKey)
      if (!mounted.current) {
        return
      }
      // A queued Workflow can return 202 before it records its start in the blog.
      pendingCollection.current = { previousStartedAt: collector.lastStartedAt, expiresAt: Date.now() + 180000 }
      setAwaitingStart(true)
      setPollPaused(false)
      await refresh()
    } catch (err) {
      if (mounted.current) {
        showError(err)
      }
    } finally {
      if (mounted.current) {
        setBusy('')
      }
    }
  }

  const save = async (id, payload) => {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      const result = await updateNewsDraft(id, payload, adminKey)
      if (mounted.current) {
        setSelected(result.draft)
        setNotice('草稿已保存，内容仍仅管理员可见。')
        await refresh()
        return result.draft
      }
    } catch (err) {
      if (mounted.current) {
        showError(err)
      }
    } finally {
      if (mounted.current) {
        setBusy('')
      }
    }
  }

  const publish = async (id, payload) => {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      try {
        await updateNewsDraft(id, payload, adminKey)
      } catch (err) {
        if (err.status !== 409) {
          throw err
        }
        // A previous publish may have succeeded even if its response was lost.
        // Only a confirmed published draft may bypass the now-invalid edit step.
        const latest = await fetchNewsDrafts(adminKey)
        if (!latest.drafts.some(draft => draft.id === id && draft.status === 'published')) {
          throw err
        }
      }
      const result = await publishNewsDraft(id, adminKey)
      if (mounted.current) {
        setSelected(null)
        setFilter('published')
        setNotice('已发布为文章，访客现在可以阅读了。')
        setData(previous => ({ ...previous, drafts: previous.drafts.map(draft => draft.id === id ? result.draft : draft) }))
        await refresh()
        onPublished()
      }
    } catch (err) {
      if (mounted.current) {
        showError(err)
      }
    } finally {
      if (mounted.current) {
        setBusy('')
      }
    }
  }

  const dismiss = async (draft) => {
    if (!window.confirm(`确定丢弃《${draft.title}》？\n这条资讯会从草稿箱移除，也不会再次采集。`)) {
      return
    }
    setBusy(draft.id)
    setError('')
    setNotice('')
    try {
      await dismissNewsDraft(draft.id, adminKey)
      if (mounted.current) {
        setData(previous => ({ ...previous, drafts: previous.drafts.filter(item => item.id !== draft.id) }))
        if (selected?.id === draft.id) {
          setSelected(null)
        }
        setNotice('草稿已丢弃。')
        await refresh()
      }
    } catch (err) {
      if (mounted.current) {
        showError(err)
      }
    } finally {
      if (mounted.current) {
        setBusy('')
      }
    }
  }

  return (
    <div className="news-drafts">
      <section className="panel news-intro" aria-labelledby="news-drafts-title">
        <div className="news-heading-row">
          <div>
            <p className="news-eyebrow">NEWS DESK / 资讯草稿</p>
            <h2 id="news-drafts-title">把新消息，慢慢写成好文章。</h2>
            <p className="news-muted">从官方资讯来源采集，由 AI 整理中文草稿。审阅后手动发布。</p>
          </div>
          <div className="news-actions">
            <button type="button" className="btn" disabled={Boolean(busy) || running || collector.status === 'disabled' || !data} onClick={collect}>{busy === 'collect' || running ? '正在采集…' : collector.status === 'error' ? '重新采集' : '采集一批'}</button>
            <button type="button" className="btn ghost" disabled={loading || Boolean(busy)} onClick={() => refresh()}>{loading ? '刷新中…' : '刷新'}</button>
          </div>
        </div>
        <div className="news-schedule"><span>◷ {data?.schedule || '每天 09:00（UTC+8）'}</span><span>每天最多 {data?.dailyLimit || 3} 条{Number.isInteger(data?.remaining) && ` · 今日剩余 ${data.remaining} 条`}</span><span>仅管理员可见</span></div>
        <div className="news-source-list"><span>官方来源</span>{(data?.sources || []).map(source => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a>)}{!data && <span className="news-muted">加载中…</span>}</div>
        <p className="news-last-run">{collector.lastStartedAt ? `上次执行：${formatDate(collector.lastStartedAt)}（UTC+8）` : '还没有采集记录'}{collector.status === 'success' && ` · 新增 ${collector.created || 0} 条，跳过 ${collector.skipped || 0} 条`}</p>
        {running && <p className="news-collection-state" role="status">{pollPaused ? '仍在采集中。自动刷新已暂停，稍后点「刷新」查看结果。' : '正在读取来源、整理草稿，通常需要几分钟。离开页面后仍会继续。'}</p>}
        {collector.status === 'disabled' && <p className="news-collection-state">自动采集尚未启用，配置完成后就可以开始收取资讯。</p>}
        {collector.status === 'error' && <p className="news-error" role="alert">上次采集未完成：{collector.error || '请稍后重试'}。已有草稿仍可审阅。</p>}
      </section>

      {error && <div className="news-feedback news-error" role="alert"><span>{error}</span><button type="button" className="news-text-button" disabled={loading || Boolean(busy)} onClick={() => refresh()}>重新加载</button></div>}
      {notice && <p className="news-feedback news-success" role="status">{notice}</p>}

      <div ref={editorAnchor} className="news-editor-anchor" />
      {selected && <NewsDraftEditor key={selected.id} draft={selected} busy={Boolean(busy)} onClose={() => setSelected(null)} onSave={save} onPublish={publish} onDirtyChange={onDirtyChange} />}

      <section aria-labelledby="news-list-title">
        <div className="news-heading-row news-list-heading">
          <h2 id="news-list-title">你的资讯草稿箱</h2>
          <div className="news-filters" aria-label="草稿状态">
            <button type="button" aria-pressed={filter === 'draft'} onClick={() => setFilter('draft')}>待审阅 <span>{pendingCount}</span></button>
            <button type="button" aria-pressed={filter === 'published'} onClick={() => setFilter('published')}>已发布 <span>{publishedCount}</span></button>
          </div>
        </div>
        {!data && loading ? <div className="panel news-empty" role="status">正在打开草稿箱…</div> : !data ? <div className="panel news-empty"><h3>草稿箱暂时没有打开</h3><p>稍后点击「重新加载」再试一次。</p></div> : drafts.length === 0 ? (
          <div className="panel news-empty">
            <span className="news-empty-icon" aria-hidden="true">{filter === 'published' ? '藏' : '空'}</span>
            <h3>{filter === 'published' ? '还没有发布的资讯' : running ? '第一批草稿正在路上' : '这里等着你的第一篇资讯'}</h3>
            <p>{filter === 'published' ? '在待审阅中打开草稿，检查内容后发布。' : running ? '采集完成后，草稿会自动出现在这里。' : '点「采集一批」试试，或等每天早上的自动采集。'}</p>
            <p className="news-muted">草稿会留在这里，审阅发布后才会出现在博客。</p>
          </div>
        ) : (
          <div className="news-draft-list">
            {drafts.map(draft => (
              <article className="panel news-draft-card" key={draft.id}>
                <div className="news-heading-row"><span className={`news-badge ${draft.status === 'published' ? 'published' : ''}`}>{draft.status === 'published' ? '✓ 已发布' : '✦ AI 草稿 · 待审阅'}</span><span className="news-muted">收录于 {formatDate(draft.createdAt)}</span></div>
                <h3>{draft.title}</h3>
                <p className="news-description">{draft.description}</p>
                <div className="news-source-meta"><SourceLink draft={draft} /><span>原文时间：{formatDate(draft.sourcePublishedAt)}（UTC+8）</span></div>
                <div className="news-card-footer">
                  <div className="news-tags">{(draft.tags || []).map(tag => <span key={tag}>#{tag}</span>)}</div>
                  <div className="news-actions">
                    {draft.status === 'draft' && <button type="button" className="news-text-button news-discard" disabled={Boolean(busy) || Boolean(selected && selected.id !== draft.id)} onClick={() => dismiss(draft)}>丢弃</button>}
                    {draft.status === 'published' && <Link className="btn" to={`/article/${draft.publishedArticleId}`}>查看文章 ↗</Link>}
                    <button type="button" className="btn ghost" disabled={Boolean(busy) || Boolean(selected && selected.id !== draft.id)} onClick={() => {
                      setSelected(draft)
                      window.requestAnimationFrame(() => editorAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                    }}>{draft.status === 'published' ? '查看草稿' : '审阅与编辑 →'}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default NewsDraftPanel
