import express from "express";
import connectionPool from "./utils/db.mjs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json())

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "https://your-frontend.vercel.app", // Frontend ที่ Deploy แล้ว
      // ✅ ให้เปลี่ยน https://your-frontend.vercel.app เป็น URL จริงของ Frontend ที่ deploy แล้ว
    ],
  })
);

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

//get all assignments
app.get("/assignments", async (req, res) => {
  try {
    const result = await connectionPool.query(`SELECT * FROM assignments`)
    res.status(200).json({ assignments: result.rows });
  } catch (error) {
    console.error("Create assignment error:", error);

    return res.status(500).json({ "message": "Server could not read assignment because database connection" });
  }
});

//get assignment by id
app.get("/assignments/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await connectionPool.query(`SELECT * FROM assignments WHERE assignment_id = $1`, [assignmentId])
    console.log(result)
    if (result.rows.length === 0) {
      return res.status(404).json({
        "message": "Server could not find a requested assignment"
      });
    }
    res.status(200).json({ assignments: result.rows[0] });
  } catch (error) {
    console.error("Create assignment error:", error);

    return res.status(500).json({ "message": "Server could not read assignment because database connection" });
  }
});

//update assignment by id
app.put("/assignments/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, content, category } = req.body;


    // 1. เช็กว่ามี assignment นี้ไหม
    const checkResult = await connectionPool.query(
      "SELECT * FROM assignments WHERE assignment_id = $1",
      [assignmentId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested assignment"
      });
    }

    // 2. update assignment
    const result = await connectionPool.query(`UPDATE assignments SET title = $1, content = $2, category = $3, updated_at = NOW() WHERE assignment_id = $4`, [title, content, category, assignmentId])
    console.log(result)
    res.status(200).json({ "message": "Updated assignment successfully" });
  } catch (error) {
    console.error("Create assignment error:", error);

    return res.status(500).json({ "message": "Server could not update assignment because database connection" });
  }
});

//update assignment by id
app.delete("/assignments/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const checkResult = await connectionPool.query(
      "SELECT * FROM assignments WHERE assignment_id = $1",
      [assignmentId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Server could not find a requested assignment" });
    }

    const result = await connectionPool.query(`DELETE FROM assignments WHERE assignment_id = $1`, [assignmentId])
    res.status(200).json({ "message": "Deleted assignment successfully" });
  } catch (error) {
    console.error("Create assignment error:", error);

    return res.status(500).json({ "message": "Server could not delete assignment because database connection" });
  }
});

app.post("/assignments", async (req, res) => {
  try {
    const { title, content, category, length, status } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ "message": "Server could not create assignment because there are missing data from client" });
    }

    const newAssignment = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date(),
      published_at: new Date(),
    }
    console.log(newAssignment)

    await connectionPool.query(`insert into assignments ( title, content, category, length, status, created_at, updated_at, published_at)values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newAssignment.title,
        newAssignment.content,
        newAssignment.category,
        newAssignment.length,
        newAssignment.status,
        newAssignment.created_at,
        newAssignment.updated_at,
        newAssignment.published_at,


      ]
    );
    return res.status(201).json({ message: "Created assignment sucessfully" })
  } catch (error) {
    console.error("Create assignment error:", error);

    return res.status(500).json({ "message": "Server could not create assignment because database connection" });
  }

})

app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
