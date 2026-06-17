import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminBoardPost() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)

    if (!player?.is_admin) {
        navigate('/dashboard')
        return null
    }

    async function publishPost() {
        if (!title.trim() || !description.trim()) {
            alert('Título y descripción son obligatorios')
            return
        }

        const confirmed = confirm('¿Publicar este anuncio en el tablón?')
        if (!confirmed) return

        const { error } = await supabase
            .from('board_posts')
            .insert({
                title: title.trim(),
                description: description.trim(),
                image_url: imageUrl.trim() || null,
                type: 'announcement',
                created_by: player.id,
                is_active: true
            })

        if (error) {
            console.log(error)
            alert('Error publicando anuncio')
            return
        }

        alert('Anuncio publicado 📢')
        navigate('/dashboard')
    }

    async function uploadBoardImage(event) {
        const file = event.target.files[0]

        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Solo puedes subir imágenes')
            return
        }

        setUploadingImage(true)

        const fileExt = file.name.split('.').pop()
        const fileName = `posts/${player.id}-${Date.now()}.${fileExt}`

        const { error } = await supabase.storage
            .from('board-posts')
            .upload(fileName, file, {
                upsert: true
            })

        if (error) {
            console.log(error)
            alert(`Error subiendo imagen: ${error.message}`)
            setUploadingImage(false)
            return
        }

        const { data } = supabase.storage
            .from('board-posts')
            .getPublicUrl(fileName)

        setImageUrl(data.publicUrl)
        setUploadingImage(false)
    }

    return (
        <main className="admin-create-page">
            <header className="admin-create-header">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Tablón del Mundial</p>
                    <h1>Nuevo anuncio 📢</h1>
                </div>
            </header>

            <section className="admin-create-card">
                <div className="admin-message-info">
                    <strong>📢 ¿Qué vas a publicar?</strong>

                    <p>
                        Este anuncio aparecerá en el tablón del Dashboard para todos los jugadores.
                    </p>

                    <p>
                        Puedes usarlo para quedadas, avisos, novedades, bromas, cambios de normas o noticias importantes de la porra.
                    </p>
                </div>

                <label>
                    Título
                    <input
                        placeholder="Ej: 🍻 Quedada Mundial"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={80}
                    />
                </label>

                <label>
                    Descripción
                    <textarea
                        placeholder="Ej: Este domingo vemos España - Arabia en casa de Nacho."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                </label>

                <label>
                    Imagen de portada URL opcional
                    <input
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                    />
                </label>

                <label>
                    Subir imagen desde galería
                    <input
                        type="file"
                        accept="image/*"
                        onChange={uploadBoardImage}
                    />
                </label>

                {uploadingImage && (
                    <p className="uploading-text">
                        Subiendo imagen...
                    </p>
                )}

                <div className="board-preview-card">
                    {imageUrl && (
                        <img src={imageUrl} alt="Vista previa" />
                    )}

                    <span>Vista previa</span>
                    <h2>{title || 'Título del anuncio'}</h2>
                    <p>{description || 'Descripción del anuncio...'}</p>
                </div>

                <div className="admin-create-actions">
                    <button
                        className="cancel-create-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancelar
                    </button>

                    <button
                        className="create-match-button"
                        onClick={publishPost}
                    >
                        Publicar anuncio
                    </button>
                </div>
            </section>
        </main>
    )
}

export default AdminBoardPost