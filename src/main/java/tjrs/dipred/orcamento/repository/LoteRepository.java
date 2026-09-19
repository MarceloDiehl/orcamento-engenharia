package tjrs.dipred.orcamento.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Lote;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Integer> {
    List<Lote> findAllByOrderByNumeroAsc();
}
