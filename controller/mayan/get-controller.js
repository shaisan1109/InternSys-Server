import fs from "fs";

const mayanGetController = (app, options, done) => {
    // GET list of documents in a cabinet
    app.get('/cabinet/:id', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/${request.params.id}/documents/?_fields_only=id,label,datetime_created,file_latest__pages_first__image_url,file_latest__id`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET count of documents in a cabinet
    app.get('/cabinet/:id/count', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/${request.params.id}/documents/?_fields_only=id`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all document types
    app.get('/get-all-doc-types', async (request, reply) => {
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/document_types/?_fields_only=id,label,documents_url',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all documents
    app.get('/documents', async (request, reply) => {
        // ?_fields_only=id,label,datetime_created,document_type__label
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/?_fields_only=id,label,datetime_created,document_type__label,file_latest__id',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all documents of a certain document type
    // NOTE: Type is a number
    app.get('/documents/:type', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/document_types/${request.params.type}/documents/`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET one document and its info
    app.get('/document/:id/info', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/?_fields_only=document_type__id,document_type__label,file_latest__filename,file_latest__id`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all tags on a document
    app.get('/document/:id/tags', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/tags/`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all page images of a document
    app.get('/document/:id/pages', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.id}/pages/?_fields_only=image_url`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // GET all page images of a document's *latest file*
    app.get('/document/:id/:latestFile/pages', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.latestFile}/pages/?_fields_only=image_url`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const json = await response.json();
        return reply.send(json);
    });

    // // GET document download
    // app.get('/document/:id/download', async (request, reply) => {
    //     const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.id}/download`,
    //         {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
    //             }
    //         }
    //     );
    //     const file = response;
    //     return reply.send(file);
    // });

    // GET document download
    app.get('/document/:id/download', async (request, reply) => {
        try {
            const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/latest/download/`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();

            // Set response headers for file download
            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="document_${request.params.id}.pdf"`);
            
            return reply.send(Buffer.from(buffer));

        } catch (error) {
            console.error('❌ Error fetching document:', error);
            return reply.status(500).send({ error: 'Failed to fetch document' });
        }
    });


    app.get('/document/:id/files/:fileId/download', async (request, reply) => {
        try {
            console.log(`📥 Fetching file from Mayan: Document ID ${request.params.id}, File ID ${request.params.fileId}`);
    
            // 🔹 Fetch file metadata first to get the correct filename & MIME type
            const metadataResponse = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.fileId}/`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            });
    
            if (!metadataResponse.ok) {
                throw new Error(`❌ Failed to fetch file metadata: ${metadataResponse.statusText}`);
            }
    
            const metadata = await metadataResponse.json();
            const originalFilename = metadata.filename; // ✅ Extract actual filename
            const mimeType = metadata.mimetype; // ✅ Get file's MIME type
    
            console.log(`📄 Downloading File: ${originalFilename} (MIME: ${mimeType})`);
    
            // 🔹 Fetch the actual file
            const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.fileId}/download/`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            });
    
            if (!response.ok) {
                throw new Error(`❌ Failed to fetch document: ${response.statusText}`);
            }
    
            const buffer = await response.arrayBuffer();
    
            // ✅ Ensure the file is returned as its original format (NOT converted)
            reply.header('Content-Type', mimeType);
            reply.header('Content-Disposition', `attachment; filename="${originalFilename}"`);
            return reply.send(Buffer.from(buffer));
    
        } catch (error) {
            console.error('❌ Error fetching document:', error);
            return reply.status(500).send({ error: 'Failed to fetch document' });
        }
    });
    

    // GET page image
    app.get('/document/:id/page/:pageid', async (request, reply) => {
        const buffer = fs.readFileSync(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.id}/pages/${request.params.pageid}/image`);

        reply.type('image/png'); // if you don't set the content, the image would be downloaded by browser instead of viewed
        reply.send(buffer);
    });

    // GET workflow instance of document
    app.get('/document/:id/workflow-instance', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/workflow_instances/`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );

        const json = await response.json();
        return reply.send(json);
    });

    done();
}

export default mayanGetController;