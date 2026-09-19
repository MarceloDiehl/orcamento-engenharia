package tjrs.dipred.orcamento.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Item;
import tjrs.dipred.orcamento.model.Subgrupo;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    List<Item> findAllBySubgrupoOrderByIdAsc(Subgrupo subgrupo);
    Optional<Item> findByCodigo(String codigo);
}
