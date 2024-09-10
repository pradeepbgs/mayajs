import { register } from "../controller/user.controller.js";
import { maya } from "../test.js";
export async function userRoutes(){
    maya.post('/api/v1/user/register')
    .isImportant()
    .handler(register);

    maya.get('/api/v1/user/:id')
        .handler((req, res) => {
            const userId = req.params.id;
            return res.json({ userId });
        });
}
