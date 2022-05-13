import { db } from "./Mysql";

export const test_sql = () => {
    const queryString = "SELECT * FROM test";

    return new Promise((resolve, reject) => {
        db.query(queryString, [], (err, result) => {
            if(err) console.error(err);
            else return resolve(result);
        })
    })
}