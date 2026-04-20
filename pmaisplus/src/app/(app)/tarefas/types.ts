export type TaskLabelDTO = { name: string; color: string | null };

export type ChecklistItemDTO = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export type ChecklistDTO = {
  id: string;
  name: string;
  items: ChecklistItemDTO[];
};

export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  listName: string;
  listOrder: number;
  position: number;
  labels: TaskLabelDTO[];
  dueDate: Date | null;
  expenseItemId: string | null;
  expenseItemLabel: string | null;
  checklists: ChecklistDTO[];
};

export type ColumnDTO = {
  listName: string;
  listOrder: number;
  tasks: TaskDTO[];
};

export type ExpenseRef = {
  id: string;
  servico: string;
  categoryName: string;
};
