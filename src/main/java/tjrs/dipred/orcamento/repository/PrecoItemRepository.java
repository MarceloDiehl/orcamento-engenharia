package tjrs.dipred.orcamento.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Item;
import tjrs.dipred.orcamento.model.Lote;
import tjrs.dipred.orcamento.model.PrecoItem;

@Repository
public interface PrecoItemRepository extends JpaRepository<PrecoItem, Integer> {
    List<PrecoItem> findAllByItemOrderByLote_NumeroAsc(Item item);
    Optional<PrecoItem> findByItemAndLote(Item item, Lote lote);
    Optional<PrecoItem> findByItem_CodigoAndLote_Numero(String codigo, Integer numeroLote);
}
