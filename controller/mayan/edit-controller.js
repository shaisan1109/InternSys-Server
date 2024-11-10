import fs from "fs";

const mayanEditController = (app, options, done) => {
    // DELETE document from Mayan
    app.delete('/document/:id/delete', async (request, reply) => {
        const response = await fetch(`http://ccscloud.dlsu.edu.ph:12707/api/v4/documents/${request.params.id}/`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Token f03a27ed9a6e0f92e6b3fd60a9b25a6c64173b32'
                }
            }
        );
        const res = await response;
        return reply.send(res);
    });

    // UPLOAD document to Mayan

    done();
}

export default mayanEditController;