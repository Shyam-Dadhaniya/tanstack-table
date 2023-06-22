import { HTML5Backend } from "react-dnd-html5-backend";
import TableData from "./components/Table";
import { DndProvider } from "react-dnd";
const App = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TableData />
    </DndProvider>
  );
};

export default App;
