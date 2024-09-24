export type FileUploadResponse = {
    success: {
        id: string
        file: string
        uploaded_at: string
        created_by: number
    }
    errors?: "file" | "login"
}

