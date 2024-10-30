import fs from "fs";

const mayanGetController = (app, options, done) => {
    // GET list of documents in a cabinet
    app.get('/cabinet/:id', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/cabinets/${request.params.id}/documents/?_fields_only=id,label`,
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
        const response = await fetch('http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/?_fields_only=id,label,datetime_created,document_type__label',
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
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/?_fields_only=document_type__id,document_type__label,file_latest__filename`,
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

    // GET document download
    app.get('/document/:id/download', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.id}/download`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const file = await response;
        return reply.send(file);
    });

    // GET page image
    app.get('/document/:id/page/:pageid', async (request, reply) => {
        const buffer = fs.readFileSync(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/files/${request.params.id}/pages/${request.params.pageid}/image`);

        reply.type('image/png'); // if you don't set the content, the image would be downloaded by browser instead of viewed
        reply.send(buffer);
    });

    done();
}

export default mayanGetController;