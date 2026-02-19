export const transformBackendDocReq = (docReq: any): any => {
  if (!docReq) return null;
  return {
    _id: docReq.id,
    category: docReq.title,
    address: null,
    status: docReq.status,
    documents: (docReq.requestedDocuments || [])
      .filter((d: any) => !d.parentId && d.count === 'SINGLE')
      .map((d: any) => ({
        _id: d.id,
        name: d.documentName || d.title,
        description: d.description,
        status: d.status.toLowerCase(),
        url: d.file?.url,
        uploadedAt: d.file?.url ? new Date().toISOString() : undefined,
        uploadedFileName: d.file?.file_name,
        type: d.type,
        template: d.templateFile ? { url: d.templateFile.url } : undefined
      })),
    multipleDocuments: (docReq.requestedDocuments || [])
        .filter((d: any) => !d.parentId && d.count === 'MULTIPLE')
        .map((d: any) => ({
            _id: d.id,
            name: d.documentName || d.title,
            instruction: d.description,
            type: d.type,
            multiple: d.children?.map((c: any) => ({
                _id: c.id,
                label: c.documentName || c.title,
                status: c.status.toLowerCase(),
                url: c.file?.url,
                uploadedFileName: c.file?.file_name,
                template: c.templateFile ? { url: c.templateFile.url } : undefined
            })) || []
        }))
  };
};
