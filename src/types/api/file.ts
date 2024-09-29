export type FileUploadResponse = {
    success: {
        uuid: string
    }
    errors?: "file" | "login"
}

