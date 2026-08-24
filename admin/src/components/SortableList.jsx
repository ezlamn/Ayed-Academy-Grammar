/* ================================================================
   SORTABLE-LIST.JSX — قائمة قابلة لإعادة الترتيب بالسحب
   ----------------------------------------------------------------
   الترتيب الجديد بيتبعت للسيرفر كمصفوفة ids كاملة، والسيرفر
   بيتحقق إن كلها تابعة لنفس الأب قبل ما يطبّق.
   ================================================================ */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`sortable-item${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <span className="drag-handle" {...attributes} {...listeners} title="اسحب لإعادة الترتيب">⋮⋮</span>
      {children}
    </div>
  );
}

/**
 * @param {Array} items عناصر لها id
 * @param {(ids:number[]) => void} onReorder بيتنادى بالترتيب الجديد
 * @param {(item:any, index:number) => React.ReactNode} renderItem
 */
export default function SortableList({ items, onReorder, renderItem }) {
  const sensors = useSensors(
    // مسافة تفعيل صغيرة عشان الضغط على الأزرار جوه الصف ما يبدأش سحب
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(items, oldIndex, newIndex).map(i => i.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableRow key={item.id} id={item.id}>
            {renderItem(item, index)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}
